const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { EmailVerifier } = require('node-email-verifier');

const app = express();
const port = 3000;

app.use(express.static('static'));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

app.post('/upload', upload.single('file'), (req, res) => {
    const image_path = 'static/uploads/' + req.file.filename;

    Tesseract.recognize(
        image_path,
        'eng',
        { logger: info => console.log(info) }
    ).then(({ data: { text } }) => {
        const email_verifier = new EmailVerifier();
        const { sender_email, main_body } = email_verifier.extract_email_and_content(text);

        // Perform domain legitimacy verification
        const domain_legitimacy = email_verifier.verify_domain(sender_email);

        // Perform grammar check
        const grammar_score = email_verifier.check_grammar(main_body);

        // Calculate overall legitimacy score
        const overall_legitimacy_score = email_verifier.calculate_legitimacy_score(domain_legitimacy, grammar_score);

        // Display the extracted text for demonstration purposes
        res.sendFile(__dirname + '/templates/result.html', {
            extracted_text: text,
            sender_email,
            main_body,
            domain_legitimacy,
            grammar_score,
            overall_legitimacy_score,
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
