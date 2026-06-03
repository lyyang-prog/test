/// --- 遊戲設定與變數 ---
const modelURL = 'https://teachablemachine.withgoogle.com/models/_qNCgNZbP/';
let model, maxPredictions;
let video;
let label = "等待點擊啟動...";
let confidence = 0.0;
let score = 0;
let feedbackText = "點擊畫面任意處以啟動鏡頭與 AI 🚀";
let isGameStarted = false; 
let hasScoredThisTime = false; 

const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！下一分馬上就到！ 🚀"
];

// 替代原本的 preload，改用非同步載入確保安全
async function loadModel() {
    const checkpointURL = modelURL + "model.json";
    const metadataURL = modelURL + "metadata.json";
    model = await tmImage.load(checkpointURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    label = "AI 已就緒！";
    feedbackText = "AI 載入成功！請開始挑戰！ 🙌";
    loop(); // 重新啟動 p5 的 draw 循環
}

function setup() {
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // iPad 前鏡頭設定
    let constraints = {
        video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    };
    video = createCapture(constraints);
    video.size(canvasWidth, canvasHeight);
    video.hide(); 
    
    noLoop(); // 先暫停繪製，直到點擊啟動
}

// 點擊畫面激活 iPad 鏡頭與 AI 模型
function mousePressed() {
    if (!isGameStarted) {
        isGameStarted = true;
        feedbackText = "模型與鏡頭初始化中...";
        
        // 啟動鏡頭視訊流（iOS 必須由事件觸發）
        if (video.elt && video.elt.srcObject) {
            video.elt.play();
        }
        
        loadModel().then(() => {
            predictVideo();
        });
    }
}

async function predictVideo() {
    if (isGameStarted && model) {
        // 預測鏡頭畫面
        const prediction = await model.predict(video.elt);
        
        // 找出機率最高的動作
        let highestIndex = 0;
        let highestValue = 0;
        for (let i = 0; i < maxPredictions; i++) {
            if (prediction[i].probability > highestValue) {
                highestValue = prediction[i].probability;
                highestIndex = i;
            }
        }
        
        label = prediction[highestIndex].className;
        confidence = prediction[highestIndex].probability;

        // 核心遊戲邏輯
        if (label === "handup" && confidence >= 0.8) {
            if (!hasScoredThisTime) {
                score++;
                feedbackText = "🎯 太棒了！得分！ 🎯";
                hasScoredThisTime = true; 
            }
        } else if (label === "handdown") {
            if (hasScoredThisTime) {
                hasScoredThisTime = false;
                let randomIndex = floor(random(motivationalQuotes.length));
                feedbackText = motivationalQuotes[randomIndex];
            }
        }
        
        // 持續預測
        window.requestAnimationFrame(predictVideo);
    }
}

function draw() {
    background(15, 23, 42);

    if (isGameStarted) {
        push();
        translate(width, 0);
        scale(-1, 1);
        image(video, 0, 0, width, height);
        pop();
    }

    fill(15, 23, 42, 130);
    rect(0, 0, width, height);

    // 頂部 UI
    fill(30, 41, 59, 200);
    noStroke();
    rect(0, 0, width, 70);

    fill('#f43f5e'); 
    textSize(36);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("SCORE: " + score, 20, 35);

    // 進度條
    let barWidth = 150;
    let fillWidth = barWidth * confidence;
    
    noFill();
    stroke('#38bdf8');
    strokeWeight(2);
    rect(width - barWidth - 20, 25, barWidth, 20, 5);
    
    noStroke();
    if (isGameStarted && label === "handup" && confidence >= 0.8) {
        fill('#22c55e'); 
    } else {
        fill('#38bdf8'); 
    }
    rect(width - barWidth - 20, 25, fillWidth, 20, 5);

    fill(255);
    textSize(14);
    textAlign(RIGHT, CENTER);
    textStyle(NORMAL);
    let displayLabel = isGameStarted ? label.toUpperCase() : "WAITING";
    text(`${displayLabel} (${(confidence * 100).toFixed(0)}%)`, width - 20, 55);

    // 底部文字欄
    fill(30, 41, 59, 220);
    rect(0, height - 70, width, 70);

    if (isGameStarted && label === "handup" && confidence >= 0.8) {
        fill('#4ade80'); 
    } else {
        fill('#e2e8f0'); 
    }
    textSize(18);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(feedbackText, width / 2, height - 35);
}

function windowResized() {
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    resizeCanvas(canvasWidth, canvasHeight);
}
