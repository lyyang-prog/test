// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;
let isReadyToScore = true; // 是否準備好可以得分（取代原本的 lastStatus）

// 運動激勵語錄庫
const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！下一分馬上就到！ 🚀"
];

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動 iPad 攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        const size = 400;
        const flip = true; 
        
        webcam = new tmPose.Webcam(size, size, flip); 
        
        await webcam.setup(); 
        await webcam.play();
        
        statusDiv.innerText = "相機就緒，正在加載 AI 模型...";

        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始運動！";
        document.getElementById("label-container").innerText = "把手舉高，開始集氣！🔥";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
    }
}

async function loop(timestamp) {
    if (webcam) {
        webcam.update(); 
        await predict();
    }
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    if (pose) {
        drawPose(pose);
    }

    // 只抓取 handup 的機率
    let handupProbability = 0;
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        }
    }

    const labelContainer = document.getElementById("label-container");

    // --- 🛠️ 終極修正：計時冷卻制 ---
    // 如果 handup 超過 70% 且目前是處於可以得分的狀態
    if (handupProbability >= 0.70 && isReadyToScore) {
        score++;
        document.getElementById("score-display").innerText = score;
        labelContainer.innerHTML = "🎯 太棒了！得分！ 🎯";
        
        isReadyToScore = false; // 關閉得分機制，進入冷卻狀態

        // 1.5 秒 (1500 毫秒) 後自動解鎖，並換上加油語錄
        setTimeout(() => {
            isReadyToScore = true; // 重新開放得分
            let randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
            labelContainer.innerHTML = motivationalQuotes[randomIndex] + " (準備下一發！)";
        }, 1500); 
    }
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
