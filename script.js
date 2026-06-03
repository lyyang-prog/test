// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, videoElement, ctx, maxPredictions;
let score = 0;
let scoreTimer = null; 
let isHandUpNow = false; 

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動 iPad 攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        const size = 400;

        // 🛠️ 核心修正：使用 HTML5 100% 相容 iOS 的原生鏡頭喚醒法
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: size },
                height: { ideal: size }
            },
            audio: false
        });

        // 建立隱藏的 video 標籤給 AI 讀取畫面
        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true; // ⚠️ iOS 網頁必須加這行否則會黑屏
        videoElement.muted = true;
        videoElement.width = size;
        videoElement.height = size;

        // 確保視訊流開始播放
        await videoElement.play();
        
        statusDiv.innerText = "相機就緒，正在加載 AI 模型...";

        // 載入模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 設定畫布
        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始運動！";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
        alert("無法啟動相機，請確保已允許 Safari 的相機存取權限。");
    }
}

async function loop(timestamp) {
    if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        // 更新畫布：將鏡頭畫面畫到畫布上（加入鏡像翻轉，讓運動更直覺）
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 執行 AI 預測
        await predict();
    }
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (!model || !videoElement) return;

    // 透過畫布上的影像來估算骨架
    const { pose, posenetOutput } = await model.estimatePose(canvas);
    const prediction = await model.predict(posenetOutput);

    // 繪製骨架節點
    if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
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

    // 📊 更新百分比與發光能量條
    const labelContainer = document.getElementById("label-container");
    let upPercent = (handupProbability * 100).toFixed(0);
    let downPercent = (handdownProbability * 100).toFixed(0);

    labelContainer.innerHTML = `
        <div style="margin-bottom: 8px; text-align: left;">
            <span style="color: #4ade80; font-weight: bold;">🙌 舉手集氣: ${upPercent}%</span> 
            <span style="font-size: 11px; color: #64748b;">(目標 70%)</span>
            <div style="background: #334155; width: 100%; height: 8px; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #4ade80, #22c55e); width: ${upPercent}%; height: 100%;"></div>
            </div>
        </div>
        <div style="text-align: left;">
            <span style="color: #f43f5e; font-weight: bold;">👇 放下休息: ${downPercent}%</span>
            <div style="background: #334155; width: 100%; height: 8px; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #f43f5e, #e11d48); width: ${downPercent}%; height: 100%;"></div>
            </div>
        </div>
    `;

    // 🚀 超過 70% 無上限連續加分邏輯
    if (handupProbability >= 0.70) {
        if (!isHandUpNow) {
            isHandUpNow = true;
            score++;
            document.getElementById("score-display").innerText = score;
            
            // 每 0.5 秒瘋狂跳分
            scoreTimer = setInterval(() => {
                score++;
                document.getElementById("score-display").innerText = score;
            }, 500); 
        }
    } else {
        if (isHandUpNow) {
