/* style.css */
body {
    margin: 0;
    padding: 0;
    background-color: #0f172a; /* 深藍色高質感運動背景 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    
    /* 停用 iPad 的預設手勢選取，避免干擾遊戲 */
    -webkit-touch-callout: none;
    -webkit-user-select: none;
}

#canvas-container {
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    overflow: hidden;
    border: 4px solid #38bdf8; /* 科技藍霓虹邊框 */
}
