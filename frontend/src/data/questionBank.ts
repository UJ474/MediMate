export const QUESTION_BANK = {
  opening: [
    {
      id: 'Q001',
      text: "Hi! I'm MediMate's health assistant. I'll be asking you a few questions to help your doctor understand your health better. What brings you in today?",
      type: 'text',
      field: 'chief_complaint',
    },
  ],
  symptomFollowUp: {
    chest: [
      { id: 'Q010', text: 'When did this chest discomfort start?', type: 'mcq', options: ['Today', 'Past 2–3 days', 'Past week', 'More than a week ago'], field: 'chest_onset' },
      { id: 'Q011', text: 'How would you describe the chest feeling?', type: 'mcq', options: ['Tightness / pressure', 'Sharp / stabbing pain', 'Burning', 'Heaviness'], field: 'chest_character' },
      { id: 'Q012', text: 'Does it spread to your arm, jaw, or back?', type: 'mcq', options: ['Yes, left arm', 'Yes, jaw', 'Yes, back', 'No, stays in chest'], field: 'chest_radiation' },
      { id: 'Q013', text: 'Does it get worse when you exert yourself or climb stairs?', type: 'mcq', options: ['Yes, clearly worse', 'Slightly worse', 'Not related to activity', 'Better with activity'], field: 'chest_exertion' },
    ],
    fatigue: [
      { id: 'Q020', text: 'How long have you been feeling this tiredness?', type: 'mcq', options: ['Less than a week', '1–4 weeks', '1–3 months', 'More than 3 months'], field: 'fatigue_duration' },
      { id: 'Q021', text: 'On a scale of 1–10, how severe is your fatigue? (10 = completely exhausted)', type: 'scale', min: 1, max: 10, field: 'fatigue_severity' },
      { id: 'Q022', text: 'Does rest help you feel better?', type: 'mcq', options: ['Yes, significantly', 'Slightly', 'Not at all', 'I feel worse after rest'], field: 'fatigue_rest_response' },
    ],
    breathing: [
      { id: 'Q030', text: 'When do you get breathless?', type: 'mcq', options: ['At rest', 'With mild activity (talking, dressing)', 'Walking on flat ground', 'Climbing stairs or fast walking'], field: 'breathless_trigger' },
      { id: 'Q031', text: 'Do you have to use extra pillows at night to breathe comfortably?', type: 'mcq', options: ['Yes, 2+ extra pillows', 'Yes, 1 extra', 'No, I sleep flat fine'], field: 'orthopnoea' },
    ],
  },
  general: [
    { id: 'Q100', text: 'Do you have any known medical conditions or illnesses?', type: 'text', field: 'known_conditions' },
    { id: 'Q101', text: 'Are you currently taking any medicines, including over-the-counter tablets or herbal medicines?', type: 'text', field: 'current_medications' },
    { id: 'Q102', text: 'Have you had any surgeries in the past?', type: 'mcq', options: ['No surgeries', 'Minor surgery (day procedure)', 'Major surgery (hospitalised)', 'Multiple surgeries'], field: 'surgical_history' },
    { id: 'Q103', text: 'Are you allergic to any medicines or food?', type: 'text', field: 'allergies' },
    { id: 'Q104', text: 'Any family history of heart disease, diabetes, cancer, or other major illness?', type: 'text', field: 'family_history' },
  ],
  lifestyle: [
    { id: 'Q200', text: 'Do you smoke?', type: 'mcq', options: ['No, never', 'Ex-smoker (quit)', 'Yes, occasionally', 'Yes, regularly'], field: 'smoking' },
    { id: 'Q201', text: 'How active are you physically?', type: 'mcq', options: ['I exercise regularly (4+ days/week)', 'I walk or light activity (2–3 days)', 'Mostly sedentary', 'Bed/chair-bound'], field: 'physical_activity' },
    { id: 'Q202', text: 'How are your sleep patterns?', type: 'mcq', options: ['6–8 hours, restful', 'Less than 6 hours', 'More than 9 hours', 'Very disrupted / insomnia'], field: 'sleep' },
    { id: 'Q203', text: 'How would you rate your stress levels recently?', type: 'scale', min: 1, max: 10, field: 'stress_level' },
  ],
  closing: [
    { id: 'Q300', text: "Is there anything else you'd like your doctor to know? Any concern you haven't mentioned yet?", type: 'text', field: 'additional_notes' },
  ],
};

export const MOCK_INTERVIEW_SEQUENCE = [
  {
    id: 'Q001',
    text: "Hi! I'm MediMate's AI health assistant 👋 I'll ask you some questions to help your doctor understand your situation better. This usually takes about 5–7 minutes. What is your main health concern today?",
    type: 'text',
    field: 'chief_complaint',
  },
  {
    id: 'Q002',
    text: 'How long have you been experiencing this?',
    type: 'mcq',
    options: ['Just started today', 'A few days', 'Past 1–2 weeks', 'More than 2 weeks'],
    field: 'duration',
  },
  {
    id: 'Q003',
    text: 'How severe would you rate this on a scale of 1 to 10?',
    type: 'scale',
    min: 1,
    max: 10,
    field: 'severity',
  },
  {
    id: 'Q004',
    text: 'Have you noticed if anything makes it better or worse?',
    type: 'text',
    field: 'aggravating_factors',
  },
  {
    id: 'Q005',
    text: 'Do you have any of these accompanying symptoms?',
    type: 'multi_select',
    options: ['Fever', 'Fatigue / tiredness', 'Nausea or vomiting', 'Headache', 'Breathlessness', 'Swelling in legs', 'None of the above'],
    field: 'associated_symptoms',
  },
  {
    id: 'Q006',
    text: 'Do you have any existing medical conditions that have been diagnosed before?',
    type: 'text',
    field: 'past_medical_history',
  },
  {
    id: 'Q007',
    text: 'Are you currently taking any medications — including prescription tablets, over-the-counter medicines, vitamins, or herbal supplements?',
    type: 'text',
    field: 'medications',
  },
  {
    id: 'Q008',
    text: 'Do you have any known allergies to medicines or food?',
    type: 'mcq',
    options: ['No known allergies', 'Allergy to medicines', 'Food allergy', 'Both medicine and food allergies'],
    field: 'allergies',
  },
  {
    id: 'Q009',
    text: 'Any family member with heart disease, diabetes, cancer, kidney disease, or similar serious illness?',
    type: 'text',
    field: 'family_history',
  },
  {
    id: 'Q010',
    text: 'How would you describe your lifestyle?',
    type: 'mcq',
    options: ['Mostly sedentary (desk job, minimal exercise)', 'Light activity (walking)', 'Moderately active (exercise 2–3x/week)', 'Very active (daily exercise or manual work)'],
    field: 'lifestyle',
  },
  {
    id: 'Q011',
    text: 'How are your sleep patterns?',
    type: 'mcq',
    options: ['Good — 7–8 hours, restful', 'Short — under 6 hours', 'Disrupted or broken sleep', 'Excessive — more than 9 hours'],
    field: 'sleep',
  },
  {
    id: 'Q012',
    text: 'Finally — is there anything important you want your doctor to know that you haven\'t mentioned yet?',
    type: 'text',
    field: 'additional_info',
  },
];
