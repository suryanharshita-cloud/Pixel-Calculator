const display = document.getElementById("display");
const keys = document.querySelectorAll(".key");
const themeToggle = document.getElementById("theme-toggle");
const mascot = document.getElementById("mascot");
const THEME_KEY = "calc-theme";

let mascotTimeout;
function setMascot(face, holdMs) {
  if (!mascot) return;
  clearTimeout(mascotTimeout);
  mascot.textContent = face;
  mascot.classList.add("happy");
  window.setTimeout(() => mascot.classList.remove("happy"), 200);
  if (holdMs) {
    mascotTimeout = window.setTimeout(() => {
      mascot.textContent = "(◕‿◕)";
    }, holdMs);
  }
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

themeToggle.addEventListener("click", toggleTheme);
setTheme(getTheme());

const state = {
  current: "0",
  previous: null,
  operator: null,
  waitingForOperand: false,
  justEvaluated: false,
};

function formatDisplay(value) {
  if (value === "Error") return value;
  if (!Number.isFinite(value)) return "Error";

  const str = String(value);
  if (str.length <= 12) return str;

  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return Number(value).toExponential(6);
  }

  return Number(value.toPrecision(10)).toString();
}

function updateDisplay(extraClass) {
  display.textContent = state.current;
  display.classList.remove("shake");
  if (extraClass) {
    void display.offsetWidth;
    display.classList.add(extraClass);
  }
}

function inputDigit(digit) {
  if (state.waitingForOperand || state.justEvaluated) {
    state.current = digit;
    state.waitingForOperand = false;
    state.justEvaluated = false;
    return;
  }

  state.current = state.current === "0" ? digit : state.current + digit;
}

function inputDecimal() {
  if (state.waitingForOperand || state.justEvaluated) {
    state.current = "0.";
    state.waitingForOperand = false;
    state.justEvaluated = false;
    return;
  }

  if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = false;
  state.justEvaluated = false;
  highlightOperator(null);
  setMascot("(^_-)", 900);
}

function backspace() {
  if (state.waitingForOperand || state.justEvaluated) {
    clearAll();
    return;
  }

  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
    state.current = "0";
    return;
  }

  state.current = state.current.slice(0, -1);
}

function compute(a, b, operator) {
  const left = parseFloat(a);
  const right = parseFloat(b);

  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      if (right === 0) return "Error";
      return left / right;
    default:
      return right;
  }
}

function chooseOperator(nextOperator) {
  const currentValue = parseFloat(state.current);

  if (state.operator && state.waitingForOperand) {
    state.operator = nextOperator;
    highlightOperator(nextOperator);
    return;
  }

  if (state.previous !== null && state.operator && !state.waitingForOperand) {
    const result = compute(state.previous, currentValue, state.operator);
    if (result === "Error") {
      state.current = "Error";
      state.previous = null;
      state.operator = null;
      state.waitingForOperand = true;
      highlightOperator(null);
      updateDisplay("shake");
      return;
    }

    state.current = formatDisplay(result);
    state.previous = parseFloat(state.current);
  } else {
    state.previous = currentValue;
  }

  state.operator = nextOperator;
  state.waitingForOperand = true;
  state.justEvaluated = false;
  highlightOperator(nextOperator);
}

function evaluate() {
  if (state.operator === null || state.previous === null) return;

  const result = compute(state.previous, state.current, state.operator);
  if (result === "Error") {
    state.current = "Error";
    state.previous = null;
    state.operator = null;
    state.waitingForOperand = true;
    highlightOperator(null);
    updateDisplay("shake");
    setMascot("(×_×)", 1800);
    return;
  }

  state.current = formatDisplay(result);
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = true;
  state.justEvaluated = true;
  highlightOperator(null);
  setMascot("(＾▽＾)", 1200);
}

function highlightOperator(operator) {
  keys.forEach((key) => {
    if (key.dataset.action === "operator") {
      key.classList.toggle("active-op", key.dataset.value === operator);
    }
  });
}

function flashKey(button) {
  button.classList.add("pressed");
  window.setTimeout(() => button.classList.remove("pressed"), 100);
}

function handleAction(action, value, button) {
  if (button) flashKey(button);

  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      chooseOperator(value);
      break;
    case "equals":
      evaluate();
      break;
    case "clear":
      clearAll();
      break;
    case "backspace":
      backspace();
      break;
    default:
      break;
  }

  updateDisplay();
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    handleAction(key.dataset.action, key.dataset.value, key);
  });
});

const keyboardMap = {
  "0": ["digit", "0"],
  "1": ["digit", "1"],
  "2": ["digit", "2"],
  "3": ["digit", "3"],
  "4": ["digit", "4"],
  "5": ["digit", "5"],
  "6": ["digit", "6"],
  "7": ["digit", "7"],
  "8": ["digit", "8"],
  "9": ["digit", "9"],
  ".": ["decimal"],
  ",": ["decimal"],
  "+": ["operator", "+"],
  "-": ["operator", "-"],
  "*": ["operator", "*"],
  x: ["operator", "*"],
  X: ["operator", "*"],
  "/": ["operator", "/"],
  Enter: ["equals"],
  "=": ["equals"],
  Backspace: ["backspace"],
  Delete: ["clear"],
  Escape: ["clear"],
};

document.addEventListener("keydown", (event) => {
  const mapping = keyboardMap[event.key];
  if (!mapping) return;

  event.preventDefault();
  const [action, value] = mapping;
  const button = [...keys].find(
    (key) => key.dataset.action === action && (value === undefined || key.dataset.value === value)
  );
  handleAction(action, value, button);
});

updateDisplay();
