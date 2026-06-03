// 1. 【重要】請把下方的網址換成你這次全新的 Teachable Machine 網址
const URL = 'https://teachablemachine.withgoogle.com/models/t5_tfFFbI/';

let model, webcam, ctx, labelContainer, maxPredictions;
let score = 0;
let canScore = true; 

async function init() {
    document.getElementById("status").innerHTML = "正在喚醒 AI 大脑，請稍候...";
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 載入模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 針對 iPad 調整相機尺寸與參數
        const size = 400;
        const flip = true; 
        
        // 使用 Teachable Machine 內建的 Webcam 啟動
        webcam = new tmPose.Webcam(size, size, flip);
        
        // 核心修正：iPad 強制要求相機必須面向使用者 (user)
        await webcam.setup({ facingMode: "user" }); 
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 初始化畫布
        const canvas = document.getElementById("canvas");
        canvas.width = size; 
        canvas.height = size;
        ctx = canvas.getContext("2d");
        
        labelContainer = document.getElementById("label-container");
        document.getElementById("status").innerHTML = "GAME START! 請對準鏡頭開始運動";
    } catch (e) {
        document.getElementById("status").innerHTML = "❌ 啟動失敗：請確保已允許相機權限，且網址為 https 開頭";
        console.error(e);
    }
}

async function loop(timestamp) {
    webcam.update(); 
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let statusHTML = "";

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability;
        
        // 儀表板樣式顯示機率
        statusHTML += `
            <div class="prediction-row">
                <span class="class-name">${className}</span>
                <span class="class-bar-bg">
                    <span class="class-bar-fill" style="width: ${(probability * 100)}%"></span>
                </span>
                <span class="class-pct">${(probability * 100).toFixed(0)}%</span>
            </div>
        `;

        // 得分邏輯：當偵測到 "Class 3" 且機率高於 0.70 (70%)
        if (className === "Class 3" && probability > 0.70 && canScore) {
            score += 1; 
            document.getElementById("score-display").innerHTML = score;
            
            // 進入 1 秒鐘冷卻時間，防止連加
            canScore = false;
            setTimeout(() => { canScore = true; }, 1000); 
        }
    }
    
    labelContainer.innerHTML = statusHTML;
    drawPose(pose);
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
