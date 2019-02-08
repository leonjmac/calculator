const pi = {value: 3.14159265359, code: 0x1F370}
const gr = {value: 1.61803398875, code: 0x1F300}
const pc = {value: 1.41421356237, code: 0x221A}
const om = {value: 0.5671432904, code: 0x2126}

const signed = [pi, gr, pc, om]
const numbers = [0,1,2,3,4,5,6,7,8,9]

const op_add = {label:'add', symbol:'+'}
const op_subtract = {label:'subtract', symbol:'-'}
const op_multiply = {label:'multiply', symbol:'*'}
const op_divide = {label:'divide', symbol:'/'}
const op_equals = {label:'equals', symbol:'='}
const op_percentage = {label:'percentage', symbol:'%'}
const op_clear = {label:'clear', symbol:'c'}
const op_backspace = {label:'backspace', symbol:'Backspace'}
const operators = [op_add, op_subtract, op_multiply, op_divide, op_equals, op_percentage, op_clear, op_backspace]

let _lhs = 0 // running sum
let _rhs = 0
let queuedOperation = ''
let isDecimalInUse = false
let displayStack = ['0']
let displayTextField = document.getElementById('input-current')
let signedIndicator = document.getElementById('signed')

// renamed "operate" function
function processOperation(operation) {
    // if request is to clear or perform backspace, pass through
    if(operation === op_backspace.label || operation === op_clear.label) {
        eval(`${operation}()`)
        return
    }
    
    if(operation === op_percentage.label) {
        _rhs = percentage(_lhs, _rhs)
        let status = processOperation(queuedOperation)
        if (status) {
            resetQueuedOperation()
            equals()
        }
        return        
    }
    
    // Handle equals requests
    if(operation === op_equals.label) {
        if(queuedOperation !== '' && queuedOperation !== op_equals.label) {
            let status = processOperation(queuedOperation)
            if (status) {
                resetQueuedOperation()
                equals()
            }
            return
        }
    } 
    
    // Store operation in queue for later completion i.e. at "=" or at "+"
    if(queuedOperation === '') {
        queuedOperation = operation
        _lhs = _rhs
        _rhs = 0
        resetStack()
        return
        
    } else {
    
        let success = true
        switch (queuedOperation) {
            case op_add.label:
                _lhs = add(_lhs, _rhs)
                break
            case op_divide.label:
                // guard against divide by zero
                if (_rhs === 0) {
                    // error! cannot divide by 0
                    clear()
                    displayTextField.textContent = "No Div/0 Dave!"
                    success = false
                } 
                _lhs = divide(_lhs, _rhs)
                break
            case op_multiply.label:
                _lhs = multiply(_lhs, _rhs)
                break
            case op_subtract.label:
                _lhs = subtract(_lhs, _rhs)
                break
        }
        if (success) {
            // insert code from equals
            queuedOperation = operation
            equals()
        }
        
        return success
    }    
}

function refreshDisplay() {
    let currentValue = displayStack.join('')
    displayTextField.textContent = displayStack.length === 0 ? '0' : currentValue
    _rhs = Number(currentValue)
    signedIndicator.textContent = ''
}

function resetQueuedOperation() {
    queuedOperation = ''
}

function resetStack() {
    displayStack = []
    isDecimalInUse = false
}

function toggleDecimalUse() {
    isDecimalInUse = !isDecimalInUse
}

// Core calculation methods
function add(lhs, rhs) {
    return lhs + rhs
}

function subtract(lhs, rhs) {
    return lhs - rhs
}

function multiply(lhs, rhs) {
    return lhs * rhs
}

function divide(numerator, denominator) {
    return numerator / denominator
}

function percentage(base, percent) {
    return multiply(divide(base, 100), percent)
}

function equals() {
    // Check calculated result does not exceed permitted length
    Number.isInteger(_lhs) ? truncInt() : truncFloat()
    displayStack = String(_lhs).split('')
    refreshDisplay()
    signedCheck()
    resetStack()
}

// Support calc methods
function backspace() {
    // add consideration for negative numbers too    
    if(displayStack.length === 1  && displayStack[0] === '0') {
        return
    }
    
    if(displayStack.length > 0) {
        let last = displayStack.pop()
        if (last === '.') {
            toggleDecimalUse()
        }
        if (displayStack.length === 0) {
            resetStack()
        }
        refreshDisplay()
    }
}

function clear() {
    resetStack()
    _lhs = 0
    _rhs = 0
    queuedOperation = ''
    refreshDisplay()
}

function signedCheck() {
    let filtered = signed.filter(num => num.value === _lhs)
    filtered.length === 1 ? signedIndicator.textContent = String.fromCodePoint(filtered[0].code) : signedIndicator.textContent = '' 
}

function truncInt() {
    if (_lhs > 9999999999999) {
        _lhs = 9999999999999
        alert('Upper limit of calculator reached')
    } else if (_lhs < -999999999999) {
        _lhs = -999999999999
        alert('Lower limit of calculator reached')
    }
    return _lhs
}

function truncFloat() {
    // how long is the number?
    let str = _lhs.toString()
    let len = str.length
    
    // Needs truncating if more than 11 chars (this includes the decimal point)
    if (len > 10) {
        // limit to 10 digits
        str = str.slice(0, 13)        
        // if last item is decimal point, remove as well and toggle decimal point
        if (str.endsWith('.')) {
            str = str.slice(0, 12)
        }
        _lhs = Number(str)
    }    
    return _lhs
}

// Event registration and handlers

// Mouse listeners
Array.from(document.querySelectorAll('.digit')).map(btn => btn.addEventListener('click', numberButtonHandler))

Array.from(document.querySelectorAll('.calc-op')).map(btn => btn.addEventListener('click', operationButtonHandler))

document.getElementById('decimal-point').addEventListener('click', decimalButtonHandler)

// Keyboard listeners
document.addEventListener('keyup', function(e) { 
    if(numbers.includes(Number(e.key))) {
        numberButtonHandler(e)
    } else if(e.key === '.') {
        decimalButtonHandler(e)
    } else {
        operationButtonHandler(e)
    }
})

function decimalButtonHandler(e) {
    if(!isDecimalInUse) {
        toggleDecimalUse()
        displayStack.length === 0 ? displayStack.push('0','.') : displayStack.push('.')
        refreshDisplay()
    }
}

function numberButtonHandler(e) {
    let digit = e.type === 'click' ? e.target.textContent : e.key
    if (displayStack.length === 1 && displayStack[0] === '0') {
        if (digit === '0') {
            return
        } else {
            displayStack.pop()        
        }   
    }
    
    if (displayStack.length < 13) {
        displayStack.push(digit)
        refreshDisplay()    
    } else {
        alert('Maximum number of digits reached.')
    }
}

function operationButtonHandler(e) {
    if (e.type === 'click') {
        processOperation(e.target.getAttribute('data-key'))
    } else {
        let obj = operators.filter(o => o.symbol === e.key).pop()
        if (obj) {
            processOperation(obj.label)
        }
    }
}