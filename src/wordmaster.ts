// const popMotion = require("popmotion")
import {animate} from "popmotion"
import confetti from 'canvas-confetti';
require("dotenv").config();

const {log} = console

function isLetter(letter: string) {
    return /^[a-zA-Z]$/.test(letter);
}

const BASE_URL = process.env.BASE_API_URL

async function getWordOfTheDay() {
    const response = await fetch("https://words.dev-apis.com/word-of-the-day")
    const processedResponse: any = await response.json()
    setLoading(false)
    // log(processedResponse)
    return {word: processedResponse.word, wordParts: processedResponse.word.split("")}
    // return {word: "ivory", wordParts: "ivory".split("")}
}

async function verifyWord(word: string) {
    try {
        const response = await fetch(`${BASE_URL}/validate-word`, {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({word})
        })

        const processedResponse: any = await response.json()
        if (processedResponse.validWord) {
            return true
        } else if (!processedResponse.validWord) {
            return false
        }

    } catch(error: any) {
        alert("Oops! something went wrong.")
    }
}


// Confetti Logic
let count = 200;
let defaults = {
origin: { y: 0.7 }
};

function fire(particleRatio: number, opts: any) {
    confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
    });
}

function playConfetti() {
    fire(0.25, {
    spread: 26,
    startVelocity: 55,
    });

    fire(0.2, {
    spread: 60,
    });

    fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
    });

    fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
    });

    fire(0.1, {
    spread: 120,
    startVelocity: 45,
    });
}

function setLoading(isLoading: boolean) {
    loadingDiv?.classList.toggle("show", isLoading)
}

async function validate(guessWord: string) {
    const isWordValid = await verifyWord(guessWord)
    return isWordValid
}

// Map letter counts
function makeMap(array: []) {
    const obj: any = {}
    for (let i = 0; i < array.length; i++) {
        const letter = array[i]
        if (obj[letter]) {
            obj[letter]++
        } else {
            obj[letter] = 1
        }
    }
    return obj
}

const cells = document.querySelectorAll(".cell")
const loadingDiv = document.querySelector(".info-bar") as HTMLElement
const toastWrapper = document.querySelector(".toast-wrapper") as HTMLElement
const toastContainer = document.querySelector(".toast-container") as HTMLElement
const toastDismissal = document.querySelector(".close-toast") as HTMLElement
const toastContent = document.querySelector(".toast-content") as HTMLElement
const footerBanner = document.querySelector(".footer-banner") as HTMLElement
const winAnnouncement = document.querySelector(".win-announcement") as HTMLElement
const lossAnnouncement = document.querySelector(".loss-announcement") as HTMLElement
const ROUNDS = 6
const ANSWER_LENGTH = 5
// const TOAST_DISPLAY_TIME = 1500

// =================== ENTRY POINT =======================
async function init() {
    let currentGuess = ""
    let currentRow = 0
    let isLoading = true
    let done = false

    // console.log(confetti)

    function animateToast(displayTime = 1500) {
        animate({
            from: "0rem",
            to: "5rem",
            type: "spring",
            onUpdate(update) {
                toastWrapper.style.top = update
                toastWrapper.style.display = "block"
            },
            onComplete() {
                setTimeout(() => {
                    animate({
                        from: "5rem",
                        to: "-10rem",
                        type: "spring",
                        onUpdate(update) {
                            toastWrapper.style.top = update
                        },
                        onComplete() {
                            toastWrapper.style.display = "none"
                        }
                    })
                }, displayTime)
            }
        })

    }

    animateToast(2500)


    toastDismissal.addEventListener("click", () => {
        animate({
            from: "5rem",
            to: "-10rem",
            type: "spring",
            onUpdate(update) {
                toastWrapper.style.top = update
            },
            onComplete() {
                toastWrapper.style.display = "none"
            }
        })
    })

    const {word, wordParts} = await getWordOfTheDay()
    isLoading = false

    function addLetter(letter: string) {
        if (currentGuess.length < ANSWER_LENGTH) {
            // append letter to the end
            currentGuess += letter
        } else {
            // replace letter at the end
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter
        }

        // Write to DOM
        cells[ANSWER_LENGTH * currentRow + currentGuess.length - 1].innerHTML = letter
    }

    function Backspace() {
        if (currentGuess.length >= 1) {
            currentGuess = currentGuess.substring(0, currentGuess.length - 1)
            cells[ANSWER_LENGTH * currentRow + currentGuess.length].innerHTML = ""
        }
    }

    async function commit() {
        if (currentGuess.length !== ANSWER_LENGTH) {
            return;
        }

        // TODO validate word
        isLoading = true
        setLoading(true)
        const validWord = await validate(currentGuess)
        isLoading = false
        setLoading(false)

        if (!validWord) {
            markInvalidWord()
            toastContent.innerHTML = "That ain't a word bruh!"
            toastContainer.classList.add("warning-toast")
            animateToast()
            setTimeout(() => {
                toastContainer.classList.remove("warning-toast")
            }, 3000)
            return
        }


        // BE EXTRA CAREFUL WITH THE PART OF THE CODE, IT'S THE CORE LOGIC FOR THE FUNCTIONALITY OF THE APP
        const guessParts = currentGuess.split("")
        const map = makeMap(wordParts)

        for (let i = 0; i < ANSWER_LENGTH; i++) {
            if (guessParts[i] === wordParts[i]) {
                // Mark as correct
                cells[ANSWER_LENGTH * currentRow + i].classList.add("correct")
                map[guessParts[i]]--
            }
        }

        for (let i = 0; i < ANSWER_LENGTH; i++) {
            if (guessParts[i] === wordParts[i]) {
                // do nothing
            } else if (wordParts.includes(guessParts[i])  && map[guessParts[i]] > 0) {
                // mark as close
                cells[ANSWER_LENGTH * currentRow + i].classList.add("close")
                map[guessParts[i]]--
            } else {
                // mark as wrong
                cells[ANSWER_LENGTH * currentRow + i].classList.add("wrong")
            }
        }

        currentRow++

        // If guess is the same as word - user wins
        if (currentGuess === word) {
            // User wins
            document.querySelector(".heading-title")?.classList.add("winner")
            toastContent.innerHTML = "🎉 You win 🎉 great guess!"
            toastContainer.classList.add("success-toast")
            playConfetti()
            animateToast()
            setTimeout(() => {
                toastContainer.classList.remove("sucess-toast")
            }, 3000)
            footerBanner.style.display = "block"
            winAnnouncement.style.display = "block"
            lossAnnouncement.style.display = "none"
            done = true
            return;
        }  else if (currentRow === ROUNDS) {
            // if round of guesses is complete, then we're done
            // toastContent.innerHTML = "I guess you're not a good guesser. Anyways the word was " + word
            // toastContainer.classList.add("info-toast")
            // animateToast(4000)
            // setTimeout(() => {
            //     toastContainer.classList.remove("info-toast")
            // }, 6000)
            footerBanner.style.display = "block"
            winAnnouncement.style.display = "none"
            lossAnnouncement.innerHTML = lossAnnouncement.innerHTML + " " + "🎉  " + word.toUpperCase() + "  🎉"
            lossAnnouncement.style.display = "block"
            done = true
            return
        }

        currentGuess = ""
        // =================================================================
    }

    function markInvalidWord() {
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            cells[ANSWER_LENGTH * currentRow + i].classList.add("invalid")
            setTimeout(() => {
                cells[ANSWER_LENGTH * currentRow + i].classList.remove("invalid")
            }, 1000)
        }
    }

    // Activate keyboard on mobile device
    const isMobileDevice = /Mobi/.test(navigator.userAgent);
    if (isMobileDevice) {
        document.getElementById("body")?.focus
    }


    document.addEventListener("keydown", (event) => {
        if (isLoading || done) {
            return
        }
        const action = event.key

        if (action === "Enter") {
            commit()
        } else if (action === "Backspace") {
            Backspace()
        } else if (isLetter(action)) {
            addLetter(action)
        }
    })
}

// ======= Entry Point ========
init()