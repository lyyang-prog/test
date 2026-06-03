// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;
let lastStatus = "down"; // 狀態鎖

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

    let handupProbability = 0;
    let handdownProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        } else if (prediction[i].className === "handdown") {
            handdownProbability = prediction[i].probability;
        }
    }

    const labelContainer = document.getElementById("label-container");

    // --- 🛠️ 核心除錯：優化後的計分與動態解鎖邏輯 ---
    
    // 1. 舉手判定：維持 70% 門檻。必須是從 down 狀態上來才算分
    if (handupProbability >= 0.70 && lastStatus === "down") {
        score++;
        lastStatus = "up"; // 鎖定狀態，防止重複瘋狂加分
        document.getElementById("score-display").innerText = score;
        labelContainer.innerHTML = "🎯 太棒了！得分！ 🎯";
    } 
    
    // 2. 放手解鎖判定：大幅放寬條件（只要手舉高機率跌破 30%，或者手放下的機率高於 40%）
    // 這樣可以確保玩家只要手一放低，就能 100% 成功解鎖
    else if ((handupProbability < 0.30 || handdownProbability > 0.40) && lastStatus === "up") {
        lastStatus = "down"; // 成功解鎖！準備拿下一分
        
        // 隨機換一句鼓勵語
        let randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        labelContainer.innerHTML = motivationalQuotes[randomIndex];
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
