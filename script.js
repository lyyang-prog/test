// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;

// 無限集氣專用計時器
let scoreTimer = null; 
let isHandUpNow = false; 

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 2. ⚠️ 完全復原：一模一樣用你最初能成功開啟 iPad 相機的寫法
        const size = 400;
        const flip = true; 
        webcam = new tmPose.Webcam(size, size, flip); 
        
        await webcam.setup(); 
        await webcam.play();
        
        statusDiv.innerText = "相機已就緒，正在加載模型...";

        // 加載 AI 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 設定畫布
        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始動作！";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
    }
}

async function loop(timestamp) {
    webcam.update(); // 更新相機畫面
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 執行預測
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // 繪製骨架點
    if (pose) {
        drawPose(pose);
    }

    // 抓取 handup 和 handdown 的即時機率
    let handupProbability = 0;
    let handdownProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        } else if (prediction[i].className === "handdown") {
            handdownProbability = prediction[i].probability;
        }
    }

    // 📊 滿足要求：在下方即時顯示百分比，讓用戶知道差多少
    const labelContainer = document.getElementById("label-container");
    let upPercent = (handupProbability * 100).toFixed(0);
    let downPercent = (handdownProbability * 100).toFixed(0);
    labelContainer.innerHTML = `🙌 舉手: ${upPercent}% (目標70%) | 👇 放下: ${downPercent}%`;

    // 🚀 滿足要求：只要超過 70% 就能無上限、連續跳分
    if (handupProbability >= 0.70) {
        if (!isHandUpNow) {
            isHandUpNow = true;
            score++;
            document.getElementById("score-display").innerText = "分數：" + score;
            
            // 每 0.5 秒直接加 1 分，手不放下就不會停止，沒有上限
            scoreTimer = setInterval(() => {
                score++;
                document.getElementById("score-display").innerText = "分數：" + score;
            }, 500); 
        }
    } else {
        // 如果舉手跌破 70%，立刻停止加分
        if (isHandUpNow) {
            isHandUpNow = false;
            if (scoreTimer) {
                clearInterval(scoreTimer);
                scoreTimer = null;
            }
        }
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
