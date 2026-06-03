// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;

// 無限集氣專用計時器變數
let scoreTimer = null; 
let isHandUpNow = false; 

// 運動激勵語錄庫
const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！能量正在瘋狂集氣！ 🚀"
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

    // 分別抓取 handup 和 handdown 的即時機率
    let handupProbability = 0;
    let handdownProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        } else if (prediction[i].className === "handdown") {
            handdownProbability = prediction[i].probability;
        }
    }

    // --- 📊 同時顯示百分比與精美進度條（滿足你的新需求） ---
    const labelContainer = document.getElementById("label-container");
    
    // 將數值換算成 0-100 的整數
    let upPercent = (handupProbability * 100).toFixed(0);
    let downPercent = (handdownProbability * 100).toFixed(0);

    // 用 HTML 刻出漂亮的發光進度條，讓玩家一眼看出差多少到 70%！
    labelContainer.innerHTML = `
        <div style="margin-bottom: 8px; text-align: left;">
            <span style="color: #4ade80; font-weight: bold;">🙌 舉手集氣: ${upPercent}%</span> 
            <span style="font-size: 11px; color: #64748b;">(目標 70%)</span>
            <div style="background: #334155; width: 100%; height: 8px; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #4ade80, #22c55e); width: ${upPercent}%; height: 100%; transition: width 0.1s;"></div>
            </div>
        </div>
        <div style="text-align: left;">
            <span style="color: #f43f5e; font-weight: bold;">👇 放下休息: ${downPercent}%</span>
            <div style="background: #334155; width: 100%; height: 8px; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #f43f5e, #e11d48); width: ${downPercent}%; height: 100%; transition: width 0.1s;"></div>
            </div>
        </div>
    `;

    // --- 🚀 無限制連續跳分邏輯 ---
    if (handupProbability >= 0.70) {
        // 如果剛進入舉手狀態，啟動定時器
        if (!isHandUpNow) {
            isHandUpNow = true;
            
            score++;
            document.getElementById("score-display").innerText = score;
            
            // 每 500 毫秒 (0.5秒) 分數直接無上限 +1 
            scoreTimer = setInterval(() => {
                score++;
                document.getElementById("score-display").innerText = score;
            }, 500); 
        }
    } else {
        // 當手放下來（跌破 70%）
        if (isHandUpNow) {
            isHandUpNow = false;
            
            // 立刻清除計時器，停止加分
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
