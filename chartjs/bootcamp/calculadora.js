const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2,
    tau: 2 * Math.PI,
    sqrt2: Math.SQRT2,
    ln2: Math.LN2
};

const FUNCTIONS = {
    sin: x => Math.sin(toRadians(x)),
    cos: x => Math.cos(toRadians(x)),
    tan: x => Math.tan(toRadians(x)),
    asin: x => toDegrees(Math.asin(x)),
    acos: x => toDegrees(Math.acos(x)),
    atan: x => toDegrees(Math.atan(x)),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    asinh: Math.asinh,
    acosh: Math.acosh,
    atanh: Math.atanh,
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    exp: Math.exp,
    pow: (x, y) => Math.pow(x, y),
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    factorial: factorial,
    perm: permutation,
    comb: combination,
    abs: Math.abs,
    mod: (x, y) => x % y,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    trunc: Math.trunc,
    sign: Math.sign,
    pow10: x => Math.pow(10, x),
    log1p: Math.log1p,
    expm1: Math.expm1,
    random: () => Math.random()
};

let angleMode = 'RAD';
let memory = 0;
let expression = '';
let currentInput = '';
let lastResult = null;
let waitingForOperand = false;
let history = [];

const expressionDisplay = document.getElementById('expressionDisplay');
const resultDisplay = document.getElementById('resultDisplay');
const angleModeDisplay = document.getElementById('angleMode');
const toggleAngleModeBtn = document.getElementById('toggleAngleMode');
const memoryIndicator = document.getElementById('memoryIndicator');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

function toRadians(deg) {
    return angleMode === 'DEG' ? deg * Math.PI / 180 : deg;
}

function toDegrees(rad) {
    return angleMode === 'DEG' ? rad * 180 / Math.PI : rad;
}

function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function permutation(n, r) {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
    if (r > n) return 0;
    let result = 1;
    for (let i = 0; i < r; i++) result *= (n - i);
    return result;
}

function combination(n, r) {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
    if (r > n) return 0;
    r = Math.min(r, n - r);
    let result = 1;
    for (let i = 1; i <= r; i++) {
        result = result * (n - r + i) / i;
    }
    return Math.round(result);
}

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
    if (isNaN(num)) return 'Erro';
    
    const absNum = Math.abs(num);
    if (absNum >= 1e10 || (absNum < 1e-6 && absNum !== 0)) {
        return num.toExponential(6);
    }
    
    const str = num.toString();
    if (str.length > 12) {
        return parseFloat(num.toPrecision(10)).toString();
    }
    return str;
}

function updateDisplay() {
    expressionDisplay.textContent = expression || '';
    resultDisplay.textContent = formatNumber(currentInput || (lastResult !== null ? lastResult : 0));
}

function updateMemoryIndicator() {
    memoryIndicator.style.display = memory !== 0 ? 'block' : 'none';
}

function updateAngleMode() {
    angleModeDisplay.textContent = angleMode;
}

function addToHistory(expr, result) {
    history.unshift({ expression: expr, result: result });
    if (history.length > 50) history.pop();
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span class="history-expression">${item.expression}</span>
            <span class="history-result">= ${formatNumber(item.result)}</span>
        `;
        div.addEventListener('click', () => {
            currentInput = formatNumber(item.result);
            expression = '';
            lastResult = item.result;
            waitingForOperand = true;
            updateDisplay();
        });
        historyList.appendChild(div);
    });
}

function clearHistory() {
    history = [];
    renderHistory();
}

function clearAll() {
    expression = '';
    currentInput = '';
    lastResult = null;
    waitingForOperand = false;
    updateDisplay();
}

function backspace() {
    if (waitingForOperand) return;
    currentInput = currentInput.slice(0, -1);
    if (currentInput === '' || currentInput === '-') currentInput = '0';
    updateDisplay();
}

function appendNumber(num) {
    if (waitingForOperand) {
        currentInput = num === '.' ? '0.' : num;
        waitingForOperand = false;
    } else {
        if (num === '.' && currentInput.includes('.')) return;
        if (currentInput === '0' && num !== '.') {
            currentInput = num;
        } else {
            currentInput += num;
        }
    }
    updateDisplay();
}

function appendOperator(op) {
    const operators = { add: '+', subtract: '-', multiply: '*', divide: '/', mod: '%', pow: '^' };
    const opSymbol = operators[op];
    
    if (!waitingForOperand && currentInput !== '') {
        expression += currentInput;
    } else if (expression === '' && lastResult !== null) {
        expression = formatNumber(lastResult);
    }
    
    expression += opSymbol;
    waitingForOperand = true;
    currentInput = '';
    updateDisplay();
}

function appendParenthesis(paren) {
    if (waitingForOperand || currentInput === '') {
        expression += paren;
    } else {
        expression += currentInput + paren;
        currentInput = '';
    }
    waitingForOperand = false;
    updateDisplay();
}

function appendConstant(constName) {
    const value = CONSTANTS[constName];
    if (waitingForOperand) {
        currentInput = formatNumber(value);
        waitingForOperand = false;
    } else {
        if (currentInput === '0' || currentInput === '') {
            currentInput = formatNumber(value);
        } else {
            currentInput += '*' + formatNumber(value);
        }
    }
    updateDisplay();
}

function applyFunction(funcName) {
    const func = FUNCTIONS[funcName];
    if (!func) return;
    
    let value;
    if (currentInput !== '' && !waitingForOperand) {
        value = parseFloat(currentInput);
    } else if (lastResult !== null) {
        value = lastResult;
    } else {
        return;
    }
    
    let result;
    const funcNames = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'log', 'log10', 'log2', 'exp', 'sqrt', 'cbrt', 'factorial', 'abs', 'round', 'floor', 'ceil', 'trunc', 'sign', 'pow10', 'log1p', 'expm1'];
    const twoArgFuncs = ['pow', 'perm', 'comb', 'mod'];
    
    if (twoArgFuncs.includes(funcName)) {
        expression += currentInput + getFunctionSymbol(funcName);
        waitingForOperand = true;
        currentInput = '';
        updateDisplay();
        return;
    }
    
    if (funcName === 'random') {
        result = func();
        expression = funcName + '()';
    } else if (funcNames.includes(funcName)) {
        result = func(value);
        expression = funcName + '(' + formatNumber(value) + ')';
    }
    
    if (result !== undefined) {
        addToHistory(expression, result);
        lastResult = result;
        currentInput = formatNumber(result);
        waitingForOperand = true;
        updateDisplay();
    }
}

function getFunctionSymbol(funcName) {
    const symbols = { pow: '^', perm: 'P', comb: 'C', mod: '%' };
    return symbols[funcName] || funcName;
}

function calculate() {
    if (expression === '' && currentInput === '' && lastResult === null) return;
    
    let fullExpression = expression;
    if (currentInput !== '' && !waitingForOperand) {
        fullExpression += currentInput;
    } else if (fullExpression === '' && lastResult !== null) {
        fullExpression = formatNumber(lastResult);
    }
    
    try {
        let jsExpression = fullExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\^/g, '**')
            .replace(/P/g, 'P')
            .replace(/C/g, 'C')
            .replace(/%/g, '%');
        
        jsExpression = jsExpression
            .replace(/(\d+)P(\d+)/g, (_, n, r) => `permutation(${n},${r})`)
            .replace(/(\d+)C(\d+)/g, (_, n, r) => `combination(${n},${r})`);
        
        const safeFunctions = {
            sin: x => Math.sin(toRadians(x)),
            cos: x => Math.cos(toRadians(x)),
            tan: x => Math.tan(toRadians(x)),
            asin: x => toDegrees(Math.asin(x)),
            acos: x => toDegrees(Math.acos(x)),
            atan: x => toDegrees(Math.atan(x)),
            sinh: Math.sinh,
            cosh: Math.cosh,
            tanh: Math.tanh,
            asinh: Math.asinh,
            acosh: Math.acosh,
            atanh: Math.atanh,
            log: Math.log,
            log10: Math.log10,
            log2: Math.log2,
            exp: Math.exp,
            pow: Math.pow,
            sqrt: Math.sqrt,
            cbrt: Math.cbrt,
            factorial: factorial,
            permutation: permutation,
            combination: combination,
            abs: Math.abs,
            round: Math.round,
            floor: Math.floor,
            ceil: Math.ceil,
            trunc: Math.trunc,
            sign: Math.sign,
            pow10: x => Math.pow(10, x),
            log1p: Math.log1p,
            expm1: Math.expm1,
            random: () => Math.random(),
            pi: Math.PI,
            e: Math.E,
            phi: (1 + Math.sqrt(5)) / 2,
            tau: 2 * Math.PI,
            sqrt2: Math.SQRT2,
            ln2: Math.LN2
        };
        
        const result = eval(jsExpression.replace(/(\w+)/g, (match) => {
            return safeFunctions[match] ? match : match;
        }));
        
        if (!isFinite(result) && result !== Infinity && result !== -Infinity) {
            throw new Error('Invalid result');
        }
        
        addToHistory(fullExpression, result);
        lastResult = result;
        currentInput = formatNumber(result);
        expression = '';
        waitingForOperand = true;
        updateDisplay();
    } catch (e) {
        resultDisplay.textContent = 'Erro';
        expressionDisplay.textContent = fullExpression;
        setTimeout(() => {
            currentInput = '';
            expression = '';
            waitingForOperand = false;
            updateDisplay();
        }, 1500);
    }
}

function handlePercentage() {
    if (currentInput !== '' && !waitingForOperand) {
        const value = parseFloat(currentInput) / 100;
        currentInput = formatNumber(value);
        updateDisplay();
    }
}

function handleSign() {
    if (currentInput !== '' && !waitingForOperand) {
        const value = parseFloat(currentInput) * -1;
        currentInput = formatNumber(value);
        updateDisplay();
    } else if (lastResult !== null) {
        lastResult = -lastResult;
        currentInput = formatNumber(lastResult);
        waitingForOperand = true;
        updateDisplay();
    }
}

function memoryClear() { memory = 0; updateMemoryIndicator(); }
function memoryRecall() { currentInput = formatNumber(memory); waitingForOperand = true; updateDisplay(); }
function memoryAdd() { 
    const value = currentInput !== '' ? parseFloat(currentInput) : (lastResult || 0);
    memory += value; 
    updateMemoryIndicator(); 
}
function memorySubtract() { 
    const value = currentInput !== '' ? parseFloat(currentInput) : (lastResult || 0);
    memory -= value; 
    updateMemoryIndicator(); 
}
function memoryStore() { 
    const value = currentInput !== '' ? parseFloat(currentInput) : (lastResult || 0);
    memory = value; 
    updateMemoryIndicator(); 
}

function toggleAngleMode() {
    angleMode = angleMode === 'RAD' ? 'DEG' : 'RAD';
    updateAngleMode();
}

document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => appendNumber(btn.dataset.num));
});

document.querySelectorAll('.op-btn[data-op]').forEach(btn => {
    const op = btn.dataset.op;
    if (op === 'equals') {
        btn.addEventListener('click', calculate);
    } else if (op === 'clear') {
        btn.addEventListener('click', clearAll);
    } else if (op === 'backspace') {
        btn.addEventListener('click', backspace);
    } else if (op === 'percent') {
        btn.addEventListener('click', handlePercentage);
    } else if (op === 'parenthesis') {
        btn.addEventListener('click', () => appendParenthesis(btn.dataset.value));
    } else {
        btn.addEventListener('click', () => appendOperator(op));
    }
});

document.querySelectorAll('.func-btn[data-func]').forEach(btn => {
    btn.addEventListener('click', () => applyFunction(btn.dataset.func));
});

document.querySelectorAll('.const-btn[data-const]').forEach(btn => {
    btn.addEventListener('click', () => appendConstant(btn.dataset.const));
});

document.getElementById('memClear').addEventListener('click', memoryClear);
document.getElementById('memRecall').addEventListener('click', memoryRecall);
document.getElementById('memAdd').addEventListener('click', memoryAdd);
document.getElementById('memSubtract').addEventListener('click', memorySubtract);
document.getElementById('memStore').addEventListener('click', memoryStore);

toggleAngleModeBtn.addEventListener('click', toggleAngleMode);
clearHistoryBtn.addEventListener('click', clearHistory);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const key = e.key;
    
    if (key >= '0' && key <= '9') appendNumber(key);
    else if (key === '.') appendNumber('.');
    else if (key === '+') appendOperator('add');
    else if (key === '-') appendOperator('subtract');
    else if (key === '*') appendOperator('multiply');
    else if (key === '/') appendOperator('divide');
    else if (key === '%') appendOperator('mod');
    else if (key === '^') appendOperator('pow');
    else if (key === '(') appendParenthesis('(');
    else if (key === ')') appendParenthesis(')');
    else if (key === 'Enter' || key === '=') { e.preventDefault(); calculate(); }
    else if (key === 'Escape') clearAll();
    else if (key === 'Backspace') backspace();
    else if (key === 'p' || key === 'P') appendConstant('pi');
    else if (key === 'e' && !e.ctrlKey && !e.metaKey) appendConstant('e');
});

updateDisplay();
updateAngleMode();
updateMemoryIndicator();