// --- 遊戲設定與變數 ---
const modelURL = 'https://teachablemachine.withgoogle.com/models/_qNCgNZbP/';
let video;
let classifier;
let label = "模型載入中...";
let confidence = 0.0;
let score = 0;
let feedbackText = "準備好開始運動了嗎？";
let hasScoredThisTime = false; 

// 運動激勵語錄
const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！下一分馬上就到！ 🚀"
];

function preload() {
    // 載入你的 Teachable Machine 模型
    classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup() {
    // 配合 iPad 螢幕比例 (4:3)
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // iPad 前鏡頭優化設定
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

    classifyVideo();
}

function classifyVideo() {
    classifier.classify(video, gotResult);
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }
    
    label = results[0].label;
    confidence = results[0].confidence;

    // 核心邏輯：判斷 handup 達 80% (0.8) 則加分
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

    // 鏡像翻轉畫面
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    // 科技感半透明遮罩
    fill(15, 23, 42, 100);
    rect(0, 0, width, height);

    // 頂部狀態列
    fill(30, 41, 59, 200);
    noStroke();
    rect(0, 0, width, 70);

    // 分數顯示
    fill('#f43f5e'); 
    textSize(36);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("SCORE: " + score, 20, 35);

    // 信心值進度條
    let barWidth = 150;
    let fillWidth = barWidth * confidence;
    
    noFill();
    stroke('#38bdf8');
    strokeWeight(2);
    rect(width - barWidth - 20, 25, barWidth, 20, 5);
    
    noStroke();
    if (label === "handup" && confidence >= 0.8) {
        fill('#22c55e'); 
    } else {
        fill('#38bdf8'); 
    }
    rect(width - barWidth - 20, 25, fillWidth, 20, 5);

    fill(255);
    textSize(14);
    textAlign(RIGHT, CENTER);
    textStyle(NORMAL);
    text(`${label.toUpperCase()} (${(confidence * 100).toFixed(0)}%)`, width - 20, 55);

    // 底部運動風看板
    fill(30, 41, 59, 220);
    rect(0, height - 70, width, 70);

    if (label === "handup" && confidence >= 0.8) {
        fill('#4ade80'); 
    } else {
        fill('#e2e8f0'); 
    }
    textSize(20);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(feedbackText, width / 2, height - 35);
}

function windowResized() {
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    resizeCanvas(canvasWidth, canvasHeight);
}
