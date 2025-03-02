function clearDisplay() {
    document.getElementById("display").value = '';
}

function appendToDisplay(value) {
    let display = document.getElementById("display");
    if (display.value === "Error") {
        display.value = '';
    }
    display.value += value;
}

function calculate() {
    try {
        let expression = document.getElementById("display").value;
        expression = expression.replace(/π/g, Math.PI);
        let result = eval(expression);
        document.getElementById("display").value = result;
    } catch (error) {
        document.getElementById("display").value = "Error";
    }
}

function toggleDarkMode() {
    const body = document.body;
    const calculator = document.querySelector('.calculator');
    const input = document.getElementById('display');
    const buttons = document.querySelectorAll('button');
    
    body.classList.toggle('dark-mode');
    calculator.classList.toggle('dark-mode');
    input.classList.toggle('dark-mode');
    
    buttons.forEach(button => {
        button.classList.toggle('dark-mode');
    });
}
