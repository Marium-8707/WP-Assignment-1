document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const introView = document.getElementById('start-screen');
    const gameView = document.getElementById('quiz-screen');
    const summaryView = document.getElementById('results-screen');
    const navigationBar = document.getElementById('breadcrumb-nav');
    
    const beginButton = document.getElementById('start-btn');
    const proceedButton = document.getElementById('next-btn');
    const timeExtraPoints = document.getElementById('timer-bonus');
    const timeDisplay = document.getElementById('timer-count');
    const questionCounter = document.getElementById('current-question');
    const questionTotal = document.getElementById('total-questions');
    const questionTotalSummary = document.getElementById('total-questions-result');
    const pointsDisplay = document.getElementById('current-score');
    const phraseDisplay = document.getElementById('mnemonic-display');
    const clueText = document.getElementById('hint-text');
    const choiceElements = document.querySelectorAll('.option');
    
    const accuracyCount = document.getElementById('correct-answers');
    const finalScore = document.getElementById('total-points');
    const restartButton = document.getElementById('play-again-btn');
    const restartButton2 = document.getElementById('play-again-btn2');
    
    const tabSelectors = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    // Game data
    const gameData = [
        {
            phrase: "Never Eat Shredded Wheat",
            choices: [
                { text: "compass directions", correct: true },
                { text: "ancient grains", correct: false },
                { text: "Allied powers in World War II", correct: false },
                { text: "presidents represented on Mount Rushmore", correct: false }
            ],
            clue: "Starting at the top and going clockwise, compass directions are north, east, south, and west."
        },
        {
            phrase: "ROY G. BIV",
            choices: [
                { text: "what to do in case of a fire", correct: false },
                { text: "trigonometric functions", correct: false },
                { text: "colors of the rainbow", correct: true },
                { text: "organ systems of the human body", correct: false }
            ],
            clue: "Starting from the outside and working inward, a rainbow's colors are traditionally broken up into red, orange, yellow, green, blue, indigo, and violet."
        },
        {
            phrase: "My Very Eager Mother Just Served Us Nachos",
            choices: [
                { text: "planets in the solar system", correct: true },
                { text: "Great Lakes of North America", correct: false },
                { text: "Seven Wonders of the Ancient World", correct: false },
                { text: "taxonomic classification levels", correct: false }
            ],
            clue: "In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune."
        },
        {
            phrase: "Please Excuse My Dear Aunt Sally",
            choices: [
                { text: "types of plants", correct: false },
                { text: "order of operations in math", correct: true },
                { text: "classification of living things", correct: false },
                { text: "elements in the periodic table", correct: false }
            ],
            clue: "Parentheses, Exponents, Multiplication/Division, Addition/Subtraction."
        },
        {
            phrase: "HOMES",
            choices: [
                { text: "types of government", correct: false },
                { text: "parts of a cell", correct: false },
                { text: "Great Lakes", correct: true },
                { text: "branches of science", correct: false }
            ],
            clue: "The five Great Lakes: Huron, Ontario, Michigan, Erie, Superior."
        }
    ];
    
    // Game state variables
    let currentIndex = 0;
    let points = 0;
    let clockInterval;
    let timeLeft = 30;
    let isClockActive = true;
    let selectedChoice = null;
    let correctTotal = 0;
    let timePoints = 0;

    // Event listeners
    beginButton.addEventListener('click', initializeGame);
    proceedButton.addEventListener('click', advanceToNextQuestion);
    restartButton.addEventListener('click', resetGame);
    restartButton2.addEventListener('click', resetGame);
    
    choiceElements.forEach(choice => {
        choice.addEventListener('click', () => {
            if (!choice.classList.contains('correct') && !choice.classList.contains('incorrect')) {
                selectChoice(choice);
            }
        });
    });
    
    // Tab navigation
    tabSelectors.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all tabs
            tabSelectors.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Core functions
    function initializeGame() {
        introView.classList.add('d-none');
        gameView.classList.remove('d-none');
        navigationBar.classList.remove('d-none');
        
        // Set up first question
        prepareQuestion(currentIndex);
        
        // Display total questions
        questionTotal.textContent = gameData.length;
        
        // Start timer if timer bonus is checked
        isClockActive = timeExtraPoints.checked;
        if (isClockActive) {
            startClock();
        } else {
            timeDisplay.parentElement.style.display = 'none';
        }
    }
    
    function prepareQuestion(index) {
        // Reset choice states
        choiceElements.forEach(choice => {
            choice.classList.remove('selected', 'correct', 'incorrect');
            choice.querySelector('.correct-icon').classList.add('d-none');
            choice.querySelector('.incorrect-icon').classList.add('d-none');
        });
        
        // Reset timer
        clearInterval(clockInterval);
        timeLeft = 30;
        if (isClockActive) {
            timeDisplay.textContent = timeLeft;
            startClock();
        }
        
        // Enable choices
        choiceElements.forEach(choice => {
            choice.style.pointerEvents = 'auto';
        });
        
        // Disable next button
        proceedButton.disabled = true;
        selectedChoice = null;
        
        // Load current question data
        const currentData = gameData[index];
        phraseDisplay.textContent = currentData.phrase;
        clueText.textContent = currentData.clue;
        
        // Set choices
        for (let i = 0; i < choiceElements.length; i++) {
            const choiceText = choiceElements[i].querySelector('.option-text');
            choiceText.textContent = currentData.choices[i].text;
            
            // Set data attribute for correct choice
            if (currentData.choices[i].correct) {
                choiceElements[i].setAttribute('data-correct', 'true');
            } else {
                choiceElements[i].removeAttribute('data-correct');
            }
        }
        
        // Update question counter
        questionCounter.textContent = index + 1;
    }
    
    function selectChoice(choice) {
        // Clear any previously selected choice
        choiceElements.forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Mark this choice as selected
        choice.classList.add('selected');
        selectedChoice = choice;
        
        // Enable next button
        proceedButton.disabled = false;
        
        // Check answer
        evaluateAnswer();
    }
    
    function evaluateAnswer() {
        // Disable all choices to prevent changing answer
        choiceElements.forEach(choice => {
            choice.style.pointerEvents = 'none';
        });
        
        // Stop timer
        clearInterval(clockInterval);
        
        // Calculate timer bonus
        if (isClockActive) {
            const questionTimeBonus = timeLeft * 10;
            timePoints += questionTimeBonus;
        }
        
        // Check if selected choice is correct
        const isCorrect = selectedChoice.hasAttribute('data-correct');
        
        if (isCorrect) {
            selectedChoice.classList.add('correct');
            selectedChoice.querySelector('.correct-icon').classList.remove('d-none');
            points += 400; // Base score for correct answer
            correctTotal++;
        } else {
            selectedChoice.classList.add('incorrect');
            selectedChoice.querySelector('.incorrect-icon').classList.remove('d-none');
            
            // Show which one was correct
            choiceElements.forEach(choice => {
                if (choice.hasAttribute('data-correct')) {
                    choice.classList.add('correct');
                    choice.querySelector('.correct-icon').classList.remove('d-none');
                }
            });
        }
        
        // Update score display
        pointsDisplay.textContent = points;
    }
    
    function advanceToNextQuestion() {
        currentIndex++;
        
        if (currentIndex < gameData.length) {
            prepareQuestion(currentIndex);
        } else {
            displayResults();
        }
    }
    
    function displayResults() {
        gameView.classList.add('d-none');
        summaryView.classList.remove('d-none');
        navigationBar.classList.add('d-none');
        
        // Update results data
        accuracyCount.textContent = correctTotal;
        questionTotalSummary.textContent = gameData.length;
        
        // Calculate final score with time bonus
        const totalPoints = points + timePoints;
        finalScore.textContent = totalPoints;
        
        // Update score breakdown in leaderboard tab
        document.querySelector('.score-item:nth-child(1) .score-value').textContent = `${points} Points`;
        document.querySelector('.score-item:nth-child(2) .score-value').textContent = `${timePoints} Points`;
        document.querySelector('.total-score .score-number').textContent = totalPoints;
        document.querySelector('.your-score-display span:last-child').textContent = totalPoints;
    }
    
    function startClock() {
        clearInterval(clockInterval);
        clockInterval = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            // Update timer color based on time remaining
            if (timeLeft <= 10) {
                timeDisplay.parentElement.style.borderColor = '#dc3545';
                timeDisplay.style.color = '#dc3545';
            } else {
                timeDisplay.parentElement.style.borderColor = '#28a745';
                timeDisplay.style.color = '#28a745';
            }
            
            if (timeLeft <= 0) {
                clearInterval(clockInterval);
                
                // Auto-select random choice if time runs out
                if (!selectedChoice) {
                    const randomChoice = choiceElements[Math.floor(Math.random() * choiceElements.length)];
                    selectChoice(randomChoice);
                }
            }
        }, 1000);
    }
    
    function resetGame() {
        // Reset game state
        currentIndex = 0;
        points = 0;
        correctTotal = 0;
        timePoints = 0;
        pointsDisplay.textContent = 0;
        
        // Show start screen
        summaryView.classList.add('d-none');
        introView.classList.remove('d-none');
    }
    
    // Initialize the game
    function setup() {
        // Shuffle game data
        randomizeArray(gameData);
        
        // Set initial value for total questions
        questionTotal.textContent = gameData.length;
        questionTotalSummary.textContent = gameData.length;
    }
    
    // Utility function to shuffle an array
    function randomizeArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Initialize the game
    setup();
});