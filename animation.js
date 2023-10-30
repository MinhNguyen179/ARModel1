/**
 * This class is in charge of handling the interaction with the AR experience through the EmbedSDK.
 */
class OxExperience {
    /**
     * Names of the elements in the AR experiences.
     */
    BCKSOUND = "audio-quiz";
    AUDIO_INCORRECT = 'audio-incorrect';
    AUDIO_CORRECT = 'audio-correct';
    ELEMENT_PI = 'element'
    ELEMENT_FAIL_PI = 'element fail';

    /**
     * Pi element animations.
     */
    PI_ANIMATIONS = {
        celebration: { name: 'Celebration', duration: 3 },
        fail: { name: 'Destruction', duration: 2.2333333492279053 },
    }

    /**
     * Constructor.
     *
     * @param embedSDK allows you to listen to events and control the scene content.
     */
    constructor(embedSDK) {
        this.embedSDK = embedSDK;
    }

    /**
     * It allows executing element's animations.
     *
     * @param name       name of the element where we want the animation to be applied.
     * @param animation  name of the animation that we want to run.
     * @param loop       if we want the animation to run in a loop, by default it always takes the false value.
     */
    async playAnimation(name, animation, loop = false) {
        await this.embedSDK.playAnimation(name, animation.name, loop);
        await this.sleep(animation.duration * 1000);
    }

    /**
     * Sleep the program as many more as indicated
     *
     * @param ms  time in milliseconds that you want the program to stop
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Stops the background music, activates the fail sound and shows the fail animation, finally puts the background music back on.
     */
    async failQuestion() {
        this.embedSDK.pause(this.BCKSOUND);
        this.embedSDK.play(this.AUDIO_INCORRECT);
        this.embedSDK.disable(this.ELEMENT_PI);
        this.embedSDK.enable(this.ELEMENT_FAIL_PI);
        await this.playAnimation(this.ELEMENT_FAIL_PI, this.PI_ANIMATIONS.fail);
        this.embedSDK.play(this.BCKSOUND);
    }

    /**
     * Stops the background music, activates the succes sound and shows the succes animation, finally puts the background music back on.
     */
    async correctQuestion() {
        this.embedSDK.pause(this.BCKSOUND);
        this.embedSDK.play(this.AUDIO_CORRECT);
        await this.playAnimation(this.ELEMENT_PI, this.PI_ANIMATIONS.celebration);
        this.embedSDK.play(this.BCKSOUND);
    }

    /**
     * Disable ELEMENT_FAIL_PI and enable ELEMENT_PI
     */
    async tryAgain() {
        this.embedSDK.disable(this.ELEMENT_FAIL_PI);
        this.embedSDK.enable(this.ELEMENT_PI);
    }
}

/**
 * This class is in charge of handling the interaction with the custom html and css code.
 */
class OxExperienceUI {

    /**
     * Html elements ids.
     */
    OX_Q_QUESTION = 'ox_q-question';
    OX_Q_STATEMENT = 'ox_q-question__statement';
    OX_Q_ANSWER_0 = 'ox_answer__1';
    OX_Q_ANSWER_1 = 'ox_answer__2';
    OX_Q_FAIL_CARD = 'ox_q-fail-card';
    OX_Q_SUCCES_CARD = 'ox_q-success-card';
    OX_Q_CARDS = 'ox_q-cards';
    OX_Q_BANNER = 'ox_q-banner';
    OX_Q_SUCCES_CARD_STATEMENT = 'ox-success-card__statement';
    OX_TRY_AGAIN = 'ox-try-again';
    OX_NEXT_QUESTION = 'ox-next-question';
    OX_AUDIO = 'ox-audio';
    CLOSE = 'ox-audio__close';

    /**
     * Array of available questions.
     * Em tạm thời hard code phần này, đoạn này có thể thay thế bằng việc lấy dữ liệu từ DB vào ạ.
     */
    QUESTIONS = [
        {
            statement: 'Complete the sequence... 0, 1, 1, 2, 3, 5, 8, 13',
            answers: [
                { statement: '21', correct: true},
                { statement: '23', correct: false},
            ]
        },
        {
            statement: 'Solve the following operation: (20x2)-30+7',
            answers: [
                { statement: '17', correct: true},
                { statement: '3', correct: false},
            ]
        },
        {
            statement: 'Solve the following first-degree equation: x + 8 = 12 - x',
            answers: [
                { statement: 'x = 4', correct: false},
                { statement: 'x = 2', correct: true},
            ]
        }
    ]

    /**
     * Callback to be executed when a question is failed.
     */
    onFailAnswer = null;

    /**
     * Callback to be executed when a question is correct.
     */
    onCorrectAnswer = null;

    /**
     * Callback to be executed when user click try again button.
     */
    tryAgain = null;

    /**
     * The index of the current question on the Questions array.
     */
    currentQuestionIndex = 0;

    /**
     * Method responsible for teaching the question
     */
    showQuestion = function () {
        document.getElementById(this.OX_Q_CARDS).style.position = 'fixed'
        document.getElementById(this.OX_Q_QUESTION).classList.add('show');
    }

    /**
     * Indicates the time the toast is available
     */
    availableTime = 3000;

    /**
     * Initialize user interactions with HTML elements.
     */
    init() {
        document.getElementById(this.OX_Q_ANSWER_0).addEventListener('click', (event) => this.answerHandler(event));
        document.getElementById(this.OX_Q_ANSWER_1).addEventListener('click', (event) => this.answerHandler(event));
        document.getElementById(this.OX_NEXT_QUESTION).addEventListener('click', () => this.nextQuestion());
        document.getElementById(this.OX_TRY_AGAIN).addEventListener('click', async () => this.againHandler());
        this.prepareQuestion(this.currentQuestionIndex);
    }

    /**
     * Handle the user answer.
     *
     * @internal
     * @param    event pointer event.
     */
    answerHandler(event) {
        if ('true' == event.target.getAttribute('data-correct')) {
            this.correctAnswer();
        } else {
            this.incorrectHandler();
        }
    }

    /**
     * Load statement and answers texts.
     *
     * @internal
     * @param   questionIndex index of the question on the questions array.
     */
    prepareQuestion(questionIndex) {
        const question = this.QUESTIONS[questionIndex];
        if (null != question) {
            document.getElementById(this.OX_Q_STATEMENT).innerHTML = question.statement;
            this.prepareAnswer(this.OX_Q_ANSWER_0, question.answers[0]);
            this.prepareAnswer(this.OX_Q_ANSWER_1, question.answers[1]);
        }
    }

    /**
     * Load answer text and correct attribute.
     *
     * @internal
     * @param htmlElementId Id of the html answer's element.
     * @param answer        Object with the answer's data.
     */
    prepareAnswer(htmlElementId, answer) {
        const htmlElement = document.getElementById(htmlElementId);
        htmlElement.innerHTML = answer.statement;
        htmlElement.setAttribute('data-correct', answer.correct);
    }

    /**
     * Handles incorrect answers. Show the incorrect answer card.
     */
    async incorrectHandler() {
        document.getElementById(this.OX_Q_QUESTION).classList.remove('show');
        if (this.onFailAnswer) {
            await this.onFailAnswer();
        }
        document.getElementById(this.OX_Q_FAIL_CARD).classList.add('show');
    }

    /**
     * Manage the correct answers. Increases the index of the questions and displays the correct answer card.
     */
    async correctAnswer() {
        document.getElementById(this.OX_Q_QUESTION).classList.remove('show');
        if (this.onCorrectAnswer) {
            await this.onCorrectAnswer();
        }
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.QUESTIONS.length) {
            this.prepareQuestion(this.currentQuestionIndex);
        } else {

            document.getElementById(this.OX_Q_SUCCES_CARD_STATEMENT).innerHTML = 'You have answered correctly all our questions!';
            document.getElementById(this.OX_NEXT_QUESTION).innerHTML = 'Try Onirix!';
        }
        document.getElementById(this.OX_Q_SUCCES_CARD).classList.add('show');
    }

    /**
     * Manage the click on "next question". Hide the correct answer panel.
     */
    nextQuestion() {
        document.getElementById(this.OX_Q_CARDS).style.position = 'inherit'
        document.getElementById(this.OX_Q_SUCCES_CARD).classList.remove('show');
        if (this.currentQuestionIndex >= this.QUESTIONS.length) {
            window.document.location.replace('https://studio.onirix.com/register?cta=exp-onx-math-quiz');
        } else {
            this.againHandler();
        }
    }

    /**
     * Function that is executed when the question fails, hides the fails card and trigger tryAgain callback.
     */
    async againHandler() {
        document.getElementById(this.OX_Q_CARDS).style.position = 'inherit';
        document.getElementById(this.OX_Q_FAIL_CARD).classList.remove('show');
        if (this.tryAgain) {
            await this.tryAgain();
        }
    }

    /**
     * Show the toast that indicates the experience has audio
     */
    toggleAudioToast() {
        document.getElementById(this.OX_AUDIO).style.display = 'block';
        setTimeout(() => {
            document.getElementById(this.OX_AUDIO).style.display = 'none';
        }, this.availableTime);

        document.getElementById(this.CLOSE).addEventListener('click',() => {
            document.getElementById(this.OX_AUDIO).style.display = 'none';
        })
    }

    /**
     * Enable the footer
     */
    showBanner() {
        document.getElementById(this.OX_Q_BANNER).style.display = "block";
    }
}
/**
 * Onirix Embed SDK allows you to listen to events and control the scene when embedding experiences in a custom domain or from the online code editor.
 * For more information visit https://docs.onirix.com/onirix-sdk/embed-sdk
 */
const embedSDK = new OnirixEmbedSDK("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMwNzcwLCJwcm9qZWN0SWQiOjYwMjQxLCJyb2xlIjozLCJpYXQiOjE2OTg1NzE2ODJ9.H8YS_-yrDcxA7GLJ3hs7urx437nXHV2IKa-XDhll02s\n");
embedSDK.connect();

const oxExperience = new OxExperience(embedSDK);

const oxExperienceUi = new OxExperienceUI();
oxExperienceUi.init();

oxExperienceUi.onFailAnswer = async () => {
    await oxExperience.failQuestion();
}

oxExperienceUi.onCorrectAnswer = async () => {
    await oxExperience.correctQuestion();
}

oxExperienceUi.tryAgain = async () => {
    await oxExperience.tryAgain();
}


/**
 * Listens when a user clicks on an element in the scene. it checks the name of the element and if it matches it shows the question
 */
embedSDK.subscribe(OnirixEmbedSDK.Events.ELEMENT_CLICK, (params) => {
    if (params.name == oxExperience.ELEMENT_PI) {
        oxExperienceUi.showQuestion();
    }
});

/**
 * It's execute when the scene is totally load and it start the game
 */
embedSDK.subscribe(OnirixEmbedSDK.Events.SCENE_LOAD_END, async (params) => {
    oxExperienceUi.toggleAudioToast();
    oxExperienceUi.showBanner();
});