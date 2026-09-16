// Demo-only records layered onto the seeded patients:
//  - a completed intake interview (anaemia pathway + Dashavidha Pariksha) for every patient
//  - past prescriptions, uploaded reports and timeline events for the OPD register patients
// Dates are relative to today so the demo always looks current.
import type { IntakeRecord, Patient, PatientDocument, Prescription } from '../types';
import { buildIntakeRecord, formatMeasurements, type Answers } from './dashavidhaQuestions';
import { isoDaysAgo } from './opdRegister';

// ---------- Intake interviews ----------

interface DemoIntake {
  // Language the patient answered in; free-text answers below are written in it.
  language: string;
  daysAgo: number;
  answers: Answers;
}

const DEMO_INTAKES: Record<string, DemoIntake> = {
  P001: {
    language: 'Hindi',
    daysAgo: 0,
    answers: {
      C1: 'थकान बहुत रहती है, सीढ़ियां चढ़ने पर सांस फूलती है और सीने में भारीपन लगता है',
      C2: 'More than 1 month',
      S1: ['Dizziness', 'Shortness of breath', 'Fast heartbeat / palpitations'],
      S2: 'Mainly when standing up',
      S3: 'During normal daily activities',
      S4: 'No',
      B1: ['Blood in stool'],
      N1: 'Vegetarian',
      N2: 'Rarely',
      N3: 'Sometimes',
      N4: 'Yes, with most meals',
      H1: 'शुगर और बीपी की बीमारी है',
      H2: 'Metformin, Glimepiride, Amlodipine, Telmisartan, Atorvastatin, Pantoprazole; घुटने के दर्द में Diclofenac',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['More tiredness', 'Reduced appetite', 'Reduced ability to exercise or work'],
      V2: '1–3 months ago',
      SA1: 'त्वचा रूखी रहती है, पहले ताकत ठीक थी',
      SA2: 'Yes',
      SA3: '1–3 months ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'तला-भुना और बहुत मसालेदार खाना',
      ST3: 'पेट में जलन और खट्टी डकारें',
      SV1: 'I need some time',
      AS1: 'Reduced',
      AS2: 'About half',
      AS4: 'Often',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'पहले रोज़ सुबह 45 मिनट टहल लेते थे, अब 15 मिनट में थक जाते हैं',
      X1: 'घुटने के दर्द के लिए दर्द की गोली अक्सर लेते हैं',
    },
  },
  P002: {
    language: 'English',
    daysAgo: 0,
    answers: {
      C1: 'My periods are irregular, I have gained a lot of weight and we have not been able to conceive',
      C2: '1–2 weeks',
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['Change in skin colour or complexion', 'Sleep changes', 'Other'],
      V2: 'More than 3 months ago',
      SA1: 'Oily skin with acne, hair thinning on the scalp but extra hair on the chin',
      SA2: 'Yes',
      SA3: 'More than 3 months ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'Sweets and fried snacks',
      ST3: 'I feel heavy and sleepy, and my stomach bloats',
      SV1: 'It varies',
      AS1: 'Increased',
      AS4: 'Sometimes',
      VY1: '20–30 minutes',
      VY2: 'No',
      X1: 'We have been trying to conceive for 18 months',
    },
  },
  P003: {
    language: 'English',
    daysAgo: 0,
    answers: {
      C1: 'Sudden very severe headache since this morning, he is confused and cannot bear light',
      C2: "I don't feel unusually tired or weak",
      N1: 'Non-vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Medium',
      P2: 'Cool weather',
      V1: ['Dizziness', 'Other'],
      V2: 'Less than 2 weeks ago',
      SA1: 'Normal for his age',
      SA2: 'No',
      SM1: 'Average',
      ST1: 'Not sure',
      SV1: 'I feel overwhelmed',
      AS1: 'Reduced',
      AS2: 'A quarter or less',
      AS4: 'Rarely or never',
      VY1: 'Less than 10 minutes',
      VY2: 'Yes',
      VY3: 'Could not walk to the washroom today without support',
      X1: 'Answers given by his son. He takes a blood thinner (warfarin).',
    },
  },
  P101: {
    language: 'Hindi',
    daysAgo: 0,
    answers: {
      C1: 'दोनों हाथों के जोड़ों में दर्द और सुबह अकड़न, ठंड में ज़्यादा होता है',
      C2: '2–4 weeks',
      S1: ['Headache', 'Feeling cold'],
      B1: ['Heavy menstrual bleeding'],
      B2: '6–7 days',
      B3: 'Every 3–4 hours',
      B4: 'Yes',
      N1: 'Vegetarian',
      N2: 'Rarely',
      N3: 'Sometimes',
      N4: 'Yes, with most meals',
      P1: 'Medium',
      P2: 'Warm weather',
      V1: ['More tiredness', 'Reduced ability to exercise or work'],
      V2: '1–3 months ago',
      SA1: 'हाथों की उंगलियों में सूजन रहती है, बाल झड़ते हैं',
      SA2: 'Yes',
      SA3: '1–3 months ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'दही और ठंडी चीज़ें',
      ST3: 'जोड़ों का दर्द और अकड़न बढ़ जाती है',
      SV1: 'I need some time',
      AS1: 'Irregular',
      AS3: 'A few times a week',
      AS4: 'Sometimes',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'पहले घर का सारा काम कर लेती थी, अब सुबह हाथ जकड़ जाते हैं',
      X1: 'थायरॉइड की गोली रोज़ लेती हूं',
    },
  },
  P102: {
    language: 'English',
    daysAgo: 0,
    answers: {
      C1: 'Burning in my upper stomach after food and sour water coming up at night',
      C2: "I don't feel unusually tired or weak",
      N1: 'Non-vegetarian',
      N2: 'Daily',
      N4: 'Yes, with most meals',
      P1: 'Medium',
      P2: 'Cool weather',
      V1: ['Reduced appetite', 'Sleep changes'],
      V2: '2 weeks to 1 month ago',
      SA1: 'Strength is normal',
      SA2: 'Nails and Hair are weak',
      SM1: 'Well-built',
      ST1: 'Yes',
      ST2: 'Spicy fish curry, black coffee and late-night meals',
      ST3: 'Slow digestion',
      SV1: 'It varies',
      AS1: 'Irregular',
      AS3: 'Almost every day',
      AS4: 'Often',
      VY1: 'More than 30 minutes',
      VY2: 'No',
      X1: 'I work night shifts and sleep only about 5 hours',
    },
  },
  P103: {
    language: 'Kannada',
    daysAgo: 1,
    answers: {
      C1: 'ಎರಡೂ ಕಾಲು ಊದಿಕೊಂಡಿದೆ, ಮಲಗಿದಾಗ ಉಸಿರಾಡಲು ಕಷ್ಟ',
      C2: '1–2 weeks',
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Warm weather',
      V1: ['More tiredness', 'Reduced ability to exercise or work', 'Sleep changes'],
      V2: 'Less than 2 weeks ago',
      SA1: 'ಚರ್ಮ ಒಣಗಿದೆ, ಶಕ್ತಿ ಕಡಿಮೆ',
      SA2: 'Yes',
      SA3: 'Less than 2 weeks ago',
      SM1: 'Thin / weak',
      ST1: 'No',
      SV1: 'I need some time',
      AS1: 'Reduced',
      AS2: 'About half',
      AS4: 'Often',
      VY1: 'Less than 10 minutes',
      VY2: 'Yes',
      VY3: 'ದೇವಸ್ಥಾನಕ್ಕೆ ನಡೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೆ, ಈಗ ಮನೆಯೊಳಗೆ ನಡೆದರೂ ಉಸಿರು ಕಟ್ಟುತ್ತದೆ',
      X1: 'ರಾತ್ರಿ ಎರಡು ದಿಂಬು ಇಟ್ಟುಕೊಂಡು ಮಲಗುತ್ತೇನೆ',
    },
  },
  P104: {
    language: 'English',
    daysAgo: 2,
    answers: {
      C1: 'Fever with body ache and sore throat for three days',
      C2: 'Less than 1 week',
      N1: 'Non-vegetarian',
      N2: 'Daily',
      N4: 'No',
      P1: 'Thin / light',
      P2: 'Cool weather',
      V1: ['More tiredness', 'Reduced appetite'],
      V2: 'Less than 2 weeks ago',
      SA1: 'Normally fit and strong',
      SA2: 'No',
      SM1: 'Average',
      ST1: 'No',
      SV1: 'I manage easily',
      AS1: 'Reduced',
      AS2: 'About three-quarters',
      AS4: 'Rarely or never',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'I cannot go to the gym since the fever started',
      X1: 'My roommate had a similar fever last week',
    },
  },
  P105: {
    language: 'Tamil',
    daysAgo: 5,
    answers: {
      C1: 'இரண்டு கால்களிலும் கூச்சம், மரத்துப்போனது போல் இருக்கிறது',
      C2: "I don't feel unusually tired or weak",
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['Sleep changes', 'Other'],
      V2: '1–3 months ago',
      SA1: 'கால் தோல் வறண்டு வெடிப்பு',
      SA2: 'Yes',
      SA3: '1–3 months ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'இனிப்பு, வெள்ளை அரிசி அதிகம்',
      ST3: 'சர்க்கரை அளவு அதிகமாகிறது, சோர்வாக இருக்கிறது',
      SV1: 'I need some time',
      AS1: 'Good',
      AS4: 'Sometimes',
      VY1: '20–30 minutes',
      VY2: 'Yes',
      VY3: 'காலையில் 45 நிமிடம் நடப்பேன், இப்போது கால் வலியால் 20 நிமிடம் தான்',
      X1: 'இரவில் கால் எரிச்சல் அதிகம்',
    },
  },
  P201: {
    language: 'Hindi',
    daysAgo: 0,
    answers: {
      C1: 'सीढ़ियां चढ़ने पर सीने में जकड़न होती है, आराम करने से ठीक हो जाती है',
      C2: '1–2 weeks',
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['Reduced ability to exercise or work', 'More tiredness'],
      V2: '2 weeks to 1 month ago',
      SA1: 'त्वचा ठीक है, ताकत पहले से थोड़ी कम',
      SA2: 'No',
      SM1: 'Well-built',
      ST1: 'Yes',
      ST2: 'घी और तली हुई चीज़ें',
      ST3: 'पेट भारी और सीने में जलन',
      SV1: 'I need some time',
      AS1: 'Good',
      AS4: 'Sometimes',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'दो मंज़िल सीढ़ियां आराम से चढ़ लेता था, अब एक मंज़िल पर रुकना पड़ता है',
      X1: 'पिताजी को 60 साल की उम्र में हार्ट अटैक आया था',
    },
  },
  P202: {
    language: 'Telugu',
    daysAgo: 0,
    answers: {
      C1: 'గుండె దడ వస్తుంది, 10–15 నిమిషాలు ఉంటుంది, చాలా నీరసంగా ఉంది',
      C2: 'More than 1 month',
      S1: ['Dizziness', 'Fast heartbeat / palpitations', 'Pale skin'],
      S2: 'At other times',
      S4: 'Yes',
      B1: ['Heavy menstrual bleeding'],
      B2: 'More than 7 days',
      B3: 'Every 1–2 hours',
      B4: 'Yes',
      N1: 'Vegetarian',
      N2: 'Rarely',
      N3: 'Yes, often',
      N4: 'Yes, with most meals',
      P1: 'Thin / light',
      P2: 'Warm weather',
      V1: ['More tiredness', 'Dizziness', 'Change in skin colour or complexion'],
      V2: '1–3 months ago',
      SA1: 'గోళ్లు పెళుసుగా విరుగుతున్నాయి, జుట్టు రాలుతోంది',
      SA2: 'Yes',
      SA3: '1–3 months ago',
      SM1: 'Thin / weak',
      ST1: 'Not sure',
      SV1: 'I feel overwhelmed',
      AS1: 'Reduced',
      AS2: 'About half',
      AS4: 'Sometimes',
      VY1: 'Less than 10 minutes',
      VY2: 'Yes',
      VY3: 'మార్కెట్‌కు నడిచి వెళ్లేదాన్ని, ఇప్పుడు ఆటోలో వెళ్తున్నాను',
      X1: 'ఐరన్ మాత్రలు వేసుకుంటే కడుపు నొప్పి వస్తుంది',
    },
  },
  P203: {
    language: 'English',
    daysAgo: 3,
    answers: {
      C1: 'Check-up after my angioplasty. No chest pain, but I get tired more easily',
      C2: '1–2 weeks',
      N1: 'Non-vegetarian',
      N2: 'Daily',
      N4: 'No',
      P1: 'Medium',
      P2: 'Cool weather',
      V1: ['More tiredness'],
      V2: '2 weeks to 1 month ago',
      SA1: 'Skin and hair normal',
      SA2: 'No',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'Pork sorpotel and alcohol at family functions',
      ST3: 'My chest feels heavy and I get palpitations the next day',
      SV1: 'I need some time',
      AS1: 'Good',
      AS4: 'Rarely or never',
      VY1: '20–30 minutes',
      VY2: 'Yes',
      VY3: 'I used to walk 5 km on the beach; now I stop at 2 km',
      X1: 'Taking all my heart tablets regularly since the angioplasty',
    },
  },
  P301: {
    language: 'Bengali',
    daysAgo: 0,
    answers: {
      C1: 'মাথাব্যথা আর পা ফুলে যাচ্ছে, এখন ২৪ সপ্তাহের গর্ভাবস্থা',
      C2: '1–2 weeks',
      N1: 'Non-vegetarian',
      N2: 'Daily',
      N4: 'Sometimes',
      P1: 'Medium',
      P2: 'Cool weather',
      V1: ['More tiredness', 'Sleep changes', 'Other'],
      V2: 'Less than 2 weeks ago',
      SA1: 'একটু চুল পড়ছে, শরীরে জোর কম',
      SA2: 'Yes',
      SA3: '2 weeks to 1 month ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'ডিম আর তেলে ভাজা খাবার',
      ST3: 'বমি বমি লাগে',
      SV1: 'It varies',
      AS1: 'Irregular',
      AS3: 'A few times a week',
      AS4: 'Often',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'অফিসে সিঁড়ি দিয়ে উঠতাম, এখন লিফট নিই',
      X1: 'মাঝে মাঝে চোখে ঝাপসা দেখি',
    },
  },
  P302: {
    language: 'Hindi',
    daysAgo: 1,
    answers: {
      C1: 'माहवारी बंद होने के 14 महीने बाद फिर से खून आया',
      C2: '2–4 weeks',
      S1: ['Dizziness', 'Feeling cold'],
      S2: 'Mainly when standing up',
      B1: ['Other'],
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['More tiredness', 'Other'],
      V2: '2 weeks to 1 month ago',
      SA1: 'त्वचा ठीक है, बस थकान रहती है',
      SA2: 'No',
      SM1: 'Average',
      ST1: 'No',
      SV1: 'I feel overwhelmed',
      AS1: 'Good',
      AS4: 'Rarely or never',
      VY1: '20–30 minutes',
      VY2: 'No',
      X1: 'बहुत डर लग रहा है, पहली बार ऐसा हुआ है',
    },
  },
  P303: {
    language: 'English',
    daysAgo: 6,
    answers: {
      C1: 'We are planning a pregnancy; my periods have been irregular in the past',
      C2: "I don't feel unusually tired or weak",
      N1: 'Non-vegetarian',
      N2: 'Daily',
      N4: 'No',
      P1: 'Thin / light',
      P2: 'Warm weather',
      V1: ['Nothing has changed'],
      SA1: 'Healthy skin and hair, good strength',
      SA2: 'No',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'Milk',
      ST3: 'Bloating and loose motions within an hour',
      SV1: 'I manage easily',
      AS1: 'Good',
      AS4: 'Rarely or never',
      VY1: 'More than 30 minutes',
      VY2: 'No',
      X1: 'Hoping to conceive in the next 6 months',
    },
  },
  P401: {
    language: 'Kannada',
    daysAgo: 0,
    answers: {
      C1: 'ಎಂಟು ತಿಂಗಳಿಂದ ಮಲಬದ್ಧತೆ, ಹೊಟ್ಟೆ ಉಬ್ಬರ, ಹಸಿವಿಲ್ಲ',
      C2: 'More than 1 month',
      S1: ['Shortness of breath', 'Pale skin'],
      S3: 'Only during strenuous exercise',
      B1: ['Blood in stool'],
      N1: 'Vegetarian',
      N2: 'Rarely',
      N3: 'Sometimes',
      N4: 'Yes, with most meals',
      P1: 'Thin / light',
      P2: 'Warm weather',
      V1: ['Reduced appetite', 'More tiredness', 'Change in skin colour or complexion'],
      V2: 'More than 3 months ago',
      SA1: 'ಚರ್ಮ ಒಣಗಿದೆ, ತೂಕ ಇಳಿದಿದೆ',
      SA2: 'Yes',
      SA3: 'More than 3 months ago',
      SM1: 'Thin / weak',
      ST1: 'Yes',
      ST2: 'ಬೇಳೆ ಮತ್ತು ಆಲೂಗಡ್ಡೆ',
      ST3: 'ಹೊಟ್ಟೆ ಉಬ್ಬರ, ಗ್ಯಾಸ್',
      SV1: 'I need some time',
      AS1: 'Reduced',
      AS2: 'A quarter or less',
      AS4: 'Often',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'ತೋಟದ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೆ, ಈಗ ಆಗುತ್ತಿಲ್ಲ',
      X1: 'ಮಲ ಕೆಲವೊಮ್ಮೆ ಕಪ್ಪು ಬಣ್ಣದಲ್ಲಿರುತ್ತದೆ',
    },
  },
  P402: {
    language: 'Kannada',
    daysAgo: 0,
    answers: {
      C1: 'ಮೂರು ತಿಂಗಳಿಂದ ನಿದ್ರೆ ಬರುತ್ತಿಲ್ಲ, ಆತಂಕ ಮತ್ತು ತಲೆನೋವು',
      C2: '2–4 weeks',
      S1: ['Headache', 'Fast heartbeat / palpitations'],
      S4: 'No',
      B1: ['No unusual bleeding'],
      N1: 'Vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Thin / light',
      P2: 'Warm weather',
      V1: ['Sleep changes', 'More tiredness', 'Reduced appetite'],
      V2: '1–3 months ago',
      SA1: 'ಕೂದಲು ಉದುರುತ್ತಿದೆ',
      SA2: 'Yes',
      SA3: '1–3 months ago',
      SM1: 'Average',
      ST1: 'Yes',
      ST2: 'ರಾತ್ರಿ ಕಾಫಿ',
      ST3: 'ನಿದ್ರೆಯೇ ಬರುವುದಿಲ್ಲ, ಎದೆ ಬಡಿತ ಹೆಚ್ಚಾಗುತ್ತದೆ',
      SV1: 'I feel overwhelmed',
      AS1: 'Irregular',
      AS3: 'Almost every day',
      AS4: 'Sometimes',
      VY1: '20–30 minutes',
      VY2: 'Yes',
      VY3: 'ಯೋಗ ಮಾಡುತ್ತಿದ್ದೆ, ಈಗ ಆಸಕ್ತಿಯೇ ಇಲ್ಲ',
      X1: 'ನಿದ್ರೆ ಮಾತ್ರೆ ಬಹುತೇಕ ದಿನಾ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ',
    },
  },
  P403: {
    language: 'Marathi',
    daysAgo: 2,
    answers: {
      C1: 'पाच आठवड्यांपासून कंबरदुखी, डाव्या पायात कळ जाते',
      C2: "I don't feel unusually tired or weak",
      N1: 'Non-vegetarian',
      N2: 'A few times a week',
      N4: 'Yes, with most meals',
      P1: 'Broad / heavy',
      P2: 'Cool weather',
      V1: ['Reduced ability to exercise or work', 'Sleep changes'],
      V2: '2 weeks to 1 month ago',
      SA1: 'त्वचा आणि ताकद ठीक, पण कंबर दुखते',
      SA2: 'No',
      SM1: 'Well-built',
      ST1: 'Yes',
      ST2: 'थंड पाणी आणि गार हवा',
      ST3: 'कंबरदुखी वाढते',
      SV1: 'I need some time',
      AS1: 'Good',
      AS4: 'Sometimes',
      VY1: '10–20 minutes',
      VY2: 'Yes',
      VY3: 'शेतात दिवसभर काम करायचो, आता अर्धा तासही वाकता येत नाही',
      X1: 'वेदनेसाठी रोज गोळी घेतो',
    },
  },
};

const firstNumber = (value: string) => Number(value.match(/\d+(\.\d+)?/)?.[0] ?? NaN);

// Fills the safety-history and Pramana answers from the patient's record, so they agree with it.
function demoIntakeFor(patient: Patient): IntakeRecord | undefined {
  const demo = DEMO_INTAKES[patient.id];
  if (!demo) return undefined;

  const weight = firstNumber(patient.vitals.weight);
  const bmi = firstNumber(patient.vitals.bmi);
  const height = Math.round(Math.sqrt(weight / bmi) * 100);
  const derived: Answers = {
    H1: patient.diagnoses.length ? patient.diagnoses.map((d) => d.name).join(', ') : 'None',
    H2: patient.medications.length ? patient.medications.map((m) => m.name).join(', ') : 'None',
    H3: patient.allergies.length ? 'Allergy to a medicine' : 'No allergies',
  };
  if (Number.isFinite(height) && height >= 50 && height <= 250) derived.PR1 = formatMeasurements(height, weight);

  return buildIntakeRecord({ ...derived, ...demo.answers }, demo.language, isoDaysAgo(demo.daysAgo));
}

// ---------- Past prescriptions and reports ----------

interface DemoVisit {
  daysAgo: number;
  doctor: string;
  specialty: string;
  hospital: string;
  diagnosis: string;
  medicines: string[];
  tests?: string[];
  notes?: string;
  followUp?: string;
}

interface DemoDoc {
  daysAgo: number;
  name: string;
  size: string;
  category: string;
  extracted: string;
}

const ANIKA = { doctor: 'Dr. Anika Mehta', specialty: 'Internal Medicine & Diabetology', hospital: 'Apollo Hospitals, Bangalore' };
const SURESH = { doctor: 'Dr. Suresh Rajan', specialty: 'Cardiology', hospital: 'Manipal Hospitals, Bangalore' };
const LALITHA = { doctor: 'Dr. Lalitha Krishnan', specialty: 'Gynaecology & Reproductive Medicine', hospital: 'Fortis Hospital, Bangalore' };
const VAIDYA = { doctor: 'Dr. Vaidya Ramachandra', specialty: 'Ayurveda & Integrative Medicine', hospital: 'NIMHANS Wellness Centre, Bangalore' };

const DEMO_HISTORY: Record<string, { visits: DemoVisit[]; documents: DemoDoc[] }> = {
  P101: {
    visits: [
      {
        daysAgo: 210, ...ANIKA, diagnosis: 'Hypothyroidism — dose review',
        medicines: ['Levothyroxine 50 mcg — Once daily — 90 days'],
        tests: ['TSH after 6 weeks'],
        notes: 'Take the tablet on an empty stomach, 30 minutes before tea or breakfast.',
        followUp: 'After 3 months',
      },
    ],
    documents: [{ daysAgo: 215, name: 'Thyroid_Profile.pdf', size: '410 KB', category: 'Lab Report', extracted: 'TSH 3.2 mIU/L (on treatment)' }],
  },
  P102: {
    visits: [
      {
        daysAgo: 40, doctor: 'Dr. K. Menon', specialty: 'General Physician', hospital: 'Menon Family Clinic, Kochi',
        diagnosis: 'Dyspepsia', medicines: ['Pantoprazole 40 mg — Once daily — 14 days'],
        notes: 'Avoid late dinners and spicy food. Do not lie down for 2 hours after meals.',
      },
    ],
    documents: [
      { daysAgo: 400, name: 'Upper_GI_Endoscopy_2025.pdf', size: '1.1 MB', category: 'Endoscopy', extracted: 'Mild antral gastritis; H. pylori negative' },
    ],
  },
  P103: {
    visits: [
      {
        daysAgo: 4, ...ANIKA, diagnosis: 'Type 2 diabetes with hypertension — blood sugar review',
        medicines: ['Metformin 500 mg — Twice daily — 30 days', 'Amlodipine 10 mg — Once daily — 30 days', 'Pioglitazone 15 mg — Once daily — 30 days'],
        tests: ['HbA1c', 'Serum creatinine'],
        notes: 'Low-salt diet. Check blood sugar twice a week.',
        followUp: 'After 1 month',
      },
    ],
    documents: [
      { daysAgo: 5, name: 'HbA1c_Report.pdf', size: '280 KB', category: 'Lab Report', extracted: 'HbA1c 7.6%' },
      { daysAgo: 1, name: 'NT_proBNP_Report.pdf', size: '190 KB', category: 'Lab Report', extracted: 'NT-proBNP 1840 pg/mL' },
    ],
  },
  P104: {
    visits: [
      {
        daysAgo: 2, ...ANIKA, diagnosis: 'Acute febrile illness',
        medicines: ['Paracetamol 650 mg — Three times daily — 5 days'],
        tests: ['CBC', 'Dengue NS1 antigen'],
        notes: 'Drink plenty of fluids. Return at once if there is bleeding, vomiting or severe abdominal pain.',
        followUp: 'After 3 days',
      },
    ],
    documents: [{ daysAgo: 1, name: 'CBC_Dengue_NS1.pdf', size: '350 KB', category: 'Lab Report', extracted: 'Platelets 1.6 lakh/µL; NS1 negative' }],
  },
  P105: {
    visits: [
      {
        daysAgo: 35, ...ANIKA, diagnosis: 'Type 2 diabetes with dyslipidaemia',
        medicines: ['Metformin 1000 mg — Twice daily — 30 days', 'Rosuvastatin 10 mg — At bedtime — 30 days'],
        tests: ['Monofilament foot sensation test'],
        followUp: 'After 1 month',
      },
      {
        daysAgo: 5, ...ANIKA, diagnosis: 'Diabetic peripheral neuropathy',
        medicines: ['Metformin 1000 mg — Twice daily — 90 days', 'Pregabalin 75 mg — At bedtime — 30 days', 'Rosuvastatin 10 mg — At bedtime — 90 days'],
        notes: 'Inspect both feet daily. Wear soft, closed footwear. Do not walk barefoot.',
        followUp: 'After 1 month',
      },
    ],
    documents: [
      { daysAgo: 36, name: 'Lipid_Profile.pdf', size: '300 KB', category: 'Lab Report', extracted: 'LDL 118 mg/dL; triglycerides 190 mg/dL' },
      { daysAgo: 6, name: 'Nerve_Conduction_Study.pdf', size: '760 KB', category: 'Neurology', extracted: 'Sensory axonal neuropathy in both legs' },
    ],
  },
  P201: {
    visits: [
      {
        daysAgo: 400, doctor: 'Dr. R. Agarwal', specialty: 'General Medicine', hospital: 'City Hospital, Lucknow',
        diagnosis: 'Hypertension with dyslipidaemia',
        medicines: ['Telmisartan 40 mg — Once daily — 90 days', 'Atorvastatin 10 mg — At bedtime — 90 days'],
        notes: 'Walk 30 minutes daily. Reduce salt and fried food.',
      },
    ],
    documents: [{ daysAgo: 380, name: 'Lipid_Profile_2025.pdf', size: '290 KB', category: 'Lab Report', extracted: 'LDL 146 mg/dL; HDL 38 mg/dL' }],
  },
  P202: {
    visits: [
      {
        daysAgo: 9, ...SURESH, diagnosis: 'Fatigue with palpitations — evaluate for anaemia',
        medicines: ['Ferrous ascorbate 100 mg — Once daily — 30 days'],
        tests: ['CBC', 'Serum ferritin', 'Thyroid profile', 'Holter monitoring (24 hours)'],
        notes: 'Take the iron tablet after food. Avoid tea for an hour around meals.',
        followUp: 'After 1 week',
      },
    ],
    documents: [{ daysAgo: 8, name: 'CBC_Report.pdf', size: '240 KB', category: 'Lab Report', extracted: 'Hb 9.8 g/dL; MCV 72 fL' }],
  },
  P203: {
    visits: [
      {
        daysAgo: 92, ...SURESH, diagnosis: 'Acute coronary syndrome — PCI to LAD',
        medicines: [
          'Aspirin 75 mg — Once daily — Long term',
          'Clopidogrel 75 mg — Once daily — 12 months',
          'Metoprolol 25 mg — Twice daily — 90 days',
          'Rosuvastatin 20 mg — At bedtime — 90 days',
        ],
        notes: 'Join cardiac rehabilitation. No heavy lifting for 6 weeks.',
        followUp: 'After 3 months',
      },
      {
        daysAgo: 3, ...SURESH, diagnosis: 'Coronary artery disease, post-PCI — stable',
        medicines: [
          'Aspirin 75 mg — Once daily — Long term',
          'Clopidogrel 75 mg — Once daily — 9 months',
          'Metoprolol 25 mg — Twice daily — 90 days',
          'Rosuvastatin 20 mg — At bedtime — 90 days',
        ],
        tests: ['Lipid profile'],
        notes: 'Avoid alcohol. Continue walking; stop and rest if there is chest discomfort.',
        followUp: 'After 3 months',
      },
    ],
    documents: [
      { daysAgo: 88, name: 'Discharge_Summary_PCI.pdf', size: '1.8 MB', category: 'Discharge Summary', extracted: 'DES to proximal LAD; EF 50%' },
      { daysAgo: 3, name: 'Echo_Report.pdf', size: '640 KB', category: 'Cardiology', extracted: 'EF 52%; no regional wall motion abnormality' },
    ],
  },
  P301: {
    visits: [
      {
        daysAgo: 28, ...LALITHA, diagnosis: 'Antenatal care — 20 weeks',
        medicines: ['Iron and folic acid — Once daily — 30 days', 'Calcium 500 mg — Twice daily — 30 days'],
        tests: ['Anomaly scan', 'Glucose challenge test at 24 weeks'],
        followUp: 'After 1 month',
      },
    ],
    documents: [{ daysAgo: 27, name: 'Anomaly_Scan_20wk.pdf', size: '2.2 MB', category: 'Ultrasound', extracted: 'Single live fetus; no anomaly detected' }],
  },
  P302: {
    visits: [
      {
        daysAgo: 1, ...LALITHA, diagnosis: 'Post-menopausal bleeding — under evaluation',
        medicines: [],
        tests: ['Transvaginal ultrasound'],
        notes: 'Do not take any hormone tablets. Come back at once if bleeding becomes heavy.',
        followUp: 'After 3 days',
      },
    ],
    documents: [{ daysAgo: 1, name: 'TVS_Report.pdf', size: '520 KB', category: 'Ultrasound', extracted: 'Endometrial thickness 7 mm' }],
  },
  P303: {
    visits: [
      {
        daysAgo: 6, ...LALITHA, diagnosis: 'Pre-conception counselling',
        medicines: ['Folic acid 5 mg — Once daily — 90 days'],
        tests: ['Anti-TPO antibodies', 'Repeat TSH after 6 weeks'],
        followUp: 'After 1 month',
      },
    ],
    documents: [{ daysAgo: 7, name: 'TSH_Rubella_IgG.pdf', size: '230 KB', category: 'Lab Report', extracted: 'TSH 3.1 mIU/L; Rubella IgG positive' }],
  },
  P401: {
    visits: [
      {
        daysAgo: 14, ...VAIDYA, diagnosis: 'Vibandha (chronic constipation)',
        medicines: ['Triphala churna 5 g — At bedtime — 14 days', 'Hingvashtak churna 2 g — Twice daily — 14 days'],
        tests: ['Haemoglobin', 'Stool occult blood'],
        notes: 'Warm water on waking. Add cooked vegetables and a little ghee to meals.',
        followUp: 'After 2 weeks',
      },
    ],
    documents: [{ daysAgo: 2, name: 'Haemoglobin_Report.pdf', size: '180 KB', category: 'Lab Report', extracted: 'Hb 11.8 g/dL (down from 12.9)' }],
  },
  P402: {
    visits: [
      {
        daysAgo: 150, doctor: 'Dr. S. Rao', specialty: 'Psychiatry', hospital: 'Mind Care Clinic, Mangaluru',
        diagnosis: 'Adjustment disorder with anxiety',
        medicines: ['Alprazolam 0.25 mg — When required (SOS) — 10 days'],
        notes: 'Short course only. Continue counselling sessions.',
        followUp: 'After 2 weeks',
      },
    ],
    documents: [{ daysAgo: 160, name: 'Thyroid_Profile_2026.pdf', size: '210 KB', category: 'Lab Report', extracted: 'TSH 2.1 mIU/L (normal)' }],
  },
  P403: {
    visits: [
      {
        daysAgo: 8, ...VAIDYA, diagnosis: 'Kati shoola (low back pain)',
        medicines: ['Mahanarayana taila — Twice daily (external) — 14 days', 'Yogaraj guggulu 2 tablets — Twice daily — 14 days'],
        tests: ['X-ray lumbosacral spine'],
        notes: 'Avoid lifting weights. Hot fomentation twice a day.',
        followUp: 'After 1 week',
      },
    ],
    documents: [{ daysAgo: 8, name: 'Xray_LS_Spine.pdf', size: '1.4 MB', category: 'Radiology', extracted: 'Mild L4–L5 disc space narrowing' }],
  },
};

function demoHistoryFor(patientId: string) {
  const history = DEMO_HISTORY[patientId];
  if (!history) return undefined;

  const prescriptions: Prescription[] = history.visits.map((v, i) => ({
    id: `RX-DEMO-${patientId}-${i + 1}`,
    date: isoDaysAgo(v.daysAgo),
    doctorName: v.doctor,
    doctorSpecialty: v.specialty,
    hospitalName: v.hospital,
    diagnosis: v.diagnosis,
    medicines: v.medicines,
    tests: v.tests ?? [],
    notes: v.notes ?? '',
    followUp: v.followUp,
  }));

  const documents: PatientDocument[] = history.documents.map((d, i) => ({
    id: `DOC-DEMO-${patientId}-${i + 1}`,
    name: d.name,
    size: d.size,
    category: d.category,
    uploadedOn: isoDaysAgo(d.daysAgo),
    extracted: d.extracted,
  }));

  const timeline: Patient['timeline'] = [
    ...history.visits.map((v) => ({
      date: isoDaysAgo(v.daysAgo),
      event: `OPD visit with ${v.doctor} (${v.hospital}) — ${v.diagnosis}`,
      type: 'visit',
    })),
    ...documents.map((d) => ({ date: d.uploadedOn, event: `Report uploaded: ${d.name} — ${d.extracted}`, type: 'document' })),
  ];

  return { prescriptions, documents, timeline };
}

// Adds demo intake and past history to a patient record without duplicating
// anything already present (safe to apply to records restored from storage).
export function withDemoRecords(patient: Patient): Patient {
  let result = patient;

  if (!result.intake) {
    const intake = demoIntakeFor(result);
    if (intake) result = { ...result, intake };
  }

  const history = demoHistoryFor(result.id);
  if (history) {
    const rxIds = new Set(result.prescriptions.map((rx) => rx.id));
    const docIds = new Set(result.documents.map((d) => d.id));
    const events = new Set(result.timeline.map((e) => `${e.date}|${e.event}`));
    result = {
      ...result,
      prescriptions: [...result.prescriptions, ...history.prescriptions.filter((rx) => !rxIds.has(rx.id))].sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
      documents: [...result.documents, ...history.documents.filter((d) => !docIds.has(d.id))].sort((a, b) =>
        b.uploadedOn.localeCompare(a.uploadedOn)
      ),
      timeline: [...result.timeline, ...history.timeline.filter((e) => !events.has(`${e.date}|${e.event}`))],
    };
  }

  return result;
}
