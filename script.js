// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;
let lastStatus = "down"; // 狀態鎖：防止單次動作連續重複加分

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
        const flip = true; // 鏡像翻轉
        
        // 使用驗證成功、相容 iPad 的 tmPose 視訊模組
        webcam = new tmPose.Webcam(size, size, flip); 
        
        await webcam.setup(); // 請求相機權限
        await webcam.play();
        
        statusDiv.innerText = "相機就緒，正在加載 AI 模型...";

        // 載入模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 設定 Canvas
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
        webcam.update(); // 實時更新視訊畫面
        await predict();
    }
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 透過 Pose 模型進行姿勢估算與預測
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // 繪製玩家畫面與彩色骨架點
    if (pose) {
        drawPose(pose);
    }

    // 動態標籤搜尋
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

    // --- 核心遊戲得分判斷（已修正為 70% 門檻） ---
    // 當偵測到 handup 機率大於等於 70% (0.70) 且上次狀態是放下的
    if (handupProbability >= 0.70 && lastStatus === "down") {
        score++;
        lastStatus = "up";
        document.getElementById("score-display").innerText = score;
        labelContainer.innerHTML = "🎯 太棒了！得分！ 🎯";
    } 
    // 當 handdown 機率大於 70% (0.70) 時，重置狀態鎖，並更換加油語錄
    else if (handdownProbability > 0.70 && lastStatus === "up") {
        lastStatus = "down";
        let randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        labelContainer.innerHTML = motivationalQuotes[randomIndex];
    }
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // 繪製骨架節點
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
