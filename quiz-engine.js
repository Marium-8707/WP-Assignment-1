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
            phrase: "Which is the smallest country in the world by area?",
            choices: [
                { text: "Monaco", correct: false },
                { text: "Vatican City", correct: true },
                { text: "Liechtenstein", correct: false },
                { text: "San Marino", correct: false }
            ],
            clue: "Vatican City, an independent city-state within Rome, covers just about 44 hectares (110 acres)."
        },
        {
            phrase: "What is the boiling point of water at sea level?",
            choices: [
                { text: "90°C", correct: false },
                { text: "100°C", correct: true },
                { text: "110°C", correct: false },
                { text: "120°C", correct: false }
            ],
            clue: "At standard atmospheric pressure, water boils at 100°C (212°F)."
        },
        {
            phrase: "Who invented the telephone?",
            choices: [
                { text: "Nikola Tesla", correct: false },
                { text: "Thomas Edison", correct: false },
                { text: "Alexander Graham Bell", correct: true },
                { text: "Albert Einstein", correct: false }
            ],
            clue: "Alexander Graham Bell was awarded the first US patent for the telephone in 1876."
        },
        {
            phrase: "Which language has the most native speakers in the world?",
            choices: [
                { text: "English", correct: false },
                { text: "Hindi", correct: false },
                { text: "Spanish", correct: false },
                { text: "Mandarin Chinese", correct: true }
            ],
            clue: "Mandarin Chinese has over 900 million native speakers, the most of any language."
        },
        {
            phrase: "What is the capital of Canada?",
            choices: [
                { text: "Toronto", correct: false },
                { text: "Vancouver", correct: false },
                { text: "Ottawa", correct: true },
                { text: "Montreal", correct: false }
            ],
            clue: "Ottawa, not Toronto or Vancouver, is the capital city of Canada."
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
