// --- 遊戲設定與變數 ---
const modelURL = 'https://teachablemachine.withgoogle.com/models/_qNCgNZbP/';
let video;
let classifier;
let label = "等待點擊啟動";
let confidence = 0.0;
let score = 0;
let feedbackText = "點擊畫面任意處啟動鏡頭與 AI 🚀";
let isGameStarted = false; 
let hasScoredThisTime = false; 

const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！下一分馬上就到！ 🚀"
];

function preload() {
    // 透過 ml5 載入 Teachable Machine 模型
    classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup() {
    // 設定適合 iPad 4:3 的畫布大小
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // 建立視訊
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
}

// 點擊畫面激活 iPad 鏡頭（解決 iOS 安全限制）
function mousePressed() {
    if (!isGameStarted) {
        isGameStarted = true;
        feedbackText = "AI 正在分析畫面中...";
        classifyVideo();
    }
}

function classifyVideo() {
    if (isGameStarted) {
        classifier.classify(video, gotResult);
    }
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }
    
    label = results[0].label;
    confidence = results[0].confidence;

    // 核心遊戲得分判斷
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

    classifyVideo();
}

function draw() {
    background(15, 23, 42);

    // 如果點擊啟動了，就畫出翻轉鏡頭畫面
    if (isGameStarted) {
        push();
        translate(width, 0);
        scale(-1, 1);
        image(video, 0, 0, width, height);
        pop();
    }

    // 運動風半透明科技濾鏡
    fill(15, 23, 42, 140);
    rect(0, 0, width, height);

    // 頂部狀態列
    fill(30, 41, 59, 220);
    noStroke();
    rect(0, 0, width, 70);

    // SCORE
    fill('#f43f5e'); 
    textSize(32);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("SCORE: " + score, 20, 35);

    // 信心值量條
    let barWidth = 140;
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

    // 狀態文字
    fill(255);
    textSize(12);
    textAlign(RIGHT, CENTER);
    textStyle(NORMAL);
    let displayLabel = isGameStarted ? label.toUpperCase() : "WAITING";
    text(`${displayLabel} (${(confidence * 100).toFixed(0)}%)`, width - 20, 56);

    // 底部看板
    fill(30, 41, 59, 240);
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
