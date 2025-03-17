import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import { Loader2 } from 'lucide-react';
import '../styles/survey.css';

const Survey = () => {
  // Шаги: 0 - имя/фамилия/почта, 1 - выбор категории и класса, 2 - выбор преимуществ, 3 - ранжирование, 4 - благодарность
  const [step, setStep] = useState(0);
  
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    educationType: '', // школа, колледж, вуз, родитель
    grade: '' // для школьников
  });
  
  const [randomizedBenefits, setRandomizedBenefits] = useState([]);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [customBenefit, setCustomBenefit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [ratings, setRatings] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Варианты образования
  const educationTypes = ["Школа", "Колледж", "ВУЗ", "Я - родитель"];
  
  // Варианты классов
  const grades = ["7 класс", "8 класс", "9 класс", "10 класс", "11 класс"];

  useEffect(() => {
    const loadBenefits = async () => {
      try {
        const response = await fetch('/benefits.csv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const benefits = results.data.map(row => row.benefit).filter(Boolean);
            setRandomizedBenefits([..._.shuffle(benefits), "Другое"]);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError('Ошибка при загрузке данных');
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setError('Ошибка при загрузке данных');
      }
    };

    loadBenefits();
  }, []);

  const handlePersonalInfoChange = (field) => (e) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleEducationTypeSelect = (type) => {
    setPersonalInfo(prev => ({
      ...prev,
      educationType: type,
      // Если выбран не "Школа", то сбрасываем класс
      grade: type === "Школа" ? prev.grade : ''
    }));
  };

  const handleGradeSelect = (grade) => {
    setPersonalInfo(prev => ({
      ...prev,
      grade: grade
    }));
  };

  const handlePersonalStep = () => {
    if (!personalInfo.firstName.trim() || !personalInfo.lastName.trim() || !personalInfo.email.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }
    
    setError('');
    setStep(1);
  };

  const handleEducationStep = () => {
    if (!personalInfo.educationType) {
      setError('Пожалуйста, выберите место обучения');
      return;
    }
    
    if (personalInfo.educationType === "Школа" && !personalInfo.grade) {
      setError('Пожалуйста, выберите класс');
      return;
    }
    
    setError('');
    setStep(2);
  };

  const getCustomBenefitsCount = () => {
    return selectedBenefits.filter(b => b.startsWith("Другое:")).length;
  };

  const handleAddCustomBenefit = () => {
    if (!customBenefit.trim()) {
      setError('Пожалуйста, введите текст');
      return;
    }
    if (selectedBenefits.length >= 10) {
      setError('Можно выбрать максимум 10 преимуществ');
      return;
    }
    if (getCustomBenefitsCount() >= 5) {
      setError('Можно добавить только 5 дополнительных вариантов');
      return;
    }
    const formattedCustomBenefit = `Другое: ${customBenefit}`;
    setSelectedBenefits([...selectedBenefits, formattedCustomBenefit]);
    setCustomBenefit('');
    setError('');
  };

  const handleBenefitSelection = (benefit) => {
    if (benefit === "Другое") {
      if (getCustomBenefitsCount() >= 5) {
        setError('Можно добавить только 5 дополнительных вариантов');
        return;
      }
      setShowCustomInput(true);
      return;
    }

    if (selectedBenefits.includes(benefit)) {
      setSelectedBenefits(selectedBenefits.filter(b => b !== benefit));
      setRatings(_.omit(ratings, benefit));
    } else if (selectedBenefits.length < 10) {
      setSelectedBenefits([...selectedBenefits, benefit]);
    } else {
      setError('Можно выбрать максимум 10 преимуществ');
    }
  };

  const handleBenefitsStep = () => {
    if (selectedBenefits.length < 3) {
      setError('Пожалуйста, выберите минимум 3 преимущества');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleRatingChange = (benefit, rating) => {
    setError('');
    const benefitWithCurrentRating = Object.entries(ratings).find(([_, value]) => value === rating);
    if (benefitWithCurrentRating) {
      const [oldBenefit] = benefitWithCurrentRating;
      if (oldBenefit !== benefit) {
        const newRatings = { ...ratings };
        delete newRatings[oldBenefit];
        setRatings(newRatings);
      }
    }
    
    setRatings({
      ...ratings,
      [benefit]: rating
    });
  };

  const isRatingAvailable = (rating) => {
    return !Object.values(ratings).includes(rating);
  };

//   const handleSubmit = async () => {
//     if (Object.keys(ratings).length !== selectedBenefits.length) {
//         setError('Пожалуйста, оцените все выбранные преимущества');
//         return;
//     }
//
//     setIsSubmitting(true);
//     setError('');
//
//     try {
//         // Формируем данные в том же формате, что и CSV
//         const timestamp = new Date().toISOString();
//         const formattedData = selectedBenefits.map(benefit => ({
//             Timestamp: timestamp,
//             'Имя': personalInfo.firstName,
//             'Фамилия': personalInfo.lastName,
//             'Email': personalInfo.email,
//             'Тип обучения': personalInfo.educationType,
//             'Класс': personalInfo.grade || 'Н/Д',
//             'Преимущество': benefit,
//             'Приоритет': ratings[benefit]
//         }));
//
//         // Отправляем массив данных на сервер
//         const response = await fetch('https://survey-backend-bqee.onrender.com', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(formattedData) // Отправляем JSON-массив
//         });
//
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.message);
//
//         // Если отправка успешна, показываем страницу благодарности
//         setStep(4);
//     } catch (error) {
//         console.error('Ошибка:', error);
//         setError('Ошибка при отправке данных.');
//     } finally {
//         setIsSubmitting(false);
//     }
// };
  const handleSubmit = async () => {
    if (Object.keys(ratings).length !== selectedBenefits.length) {
        setError('Пожалуйста, оцените все выбранные преимущества');
        return;
    }

    setIsSubmitting(true);
    setError('');

    const data = {
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        institution: personalInfo.educationType + (personalInfo.grade ? `, ${personalInfo.grade}` : ''),
        benefits: selectedBenefits.map((benefit) => ({
            benefit: benefit,
            priority: ratings[benefit]
        }))
    };

    try {
        const response = await fetch('https://benefits-survey.onrender.com/api/survey/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            setError('Ошибка при отправке данных: ' + JSON.stringify(errorData));
            return;
        }

        setStep(4);  // Переход на страницу благодарности
    } catch (error) {
        setError('Ошибка: ' + error.message);
    } finally {
        setIsSubmitting(false);
    }
};


  return (
    <div className="survey-container">
      {step === 0 ? (
        <div className="survey-section">
          <h2 className="survey-title">Добро пожаловать в опрос</h2>
          
          <div className="survey-section">
            <label className="survey-subtitle">Имя</label>
            <input
              className="survey-input"
              placeholder="Введите ваше имя"
              value={personalInfo.firstName}
              onChange={handlePersonalInfoChange('firstName')}
            />
          </div>

          <div className="survey-section">
            <label className="survey-subtitle">Фамилия</label>
            <input
              className="survey-input"
              placeholder="Введите вашу фамилию"
              value={personalInfo.lastName}
              onChange={handlePersonalInfoChange('lastName')}
            />
          </div>

          <div className="survey-section">
            <label className="survey-subtitle">Почта</label>
            <input
              className="survey-input"
              placeholder="Введите ваш email"
              type="email"
              value={personalInfo.email}
              onChange={handlePersonalInfoChange('email')}
            />
          </div>

          <button 
            className="survey-button action"
            onClick={handlePersonalStep}
          >
            Далее
          </button>
        </div>
      ) : step === 1 ? (
        <div className="survey-section">
          <h2 className="survey-title">Выберите место обучения</h2>
          
          <div className="survey-section">
            <label className="survey-subtitle">Место обучения</label>
            <div className="survey-section">
              {educationTypes.map(type => (
                <button
                  key={type}
                  className={`survey-button ${personalInfo.educationType === type ? 'selected' : ''}`}
                  onClick={() => handleEducationTypeSelect(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {personalInfo.educationType === "Школа" && (
            <div className="survey-section">
              <label className="survey-subtitle">Класс</label>
              <div className="survey-section">
                {grades.map(grade => (
                  <button
                    key={grade}
                    className={`survey-button ${personalInfo.grade === grade ? 'selected' : ''}`}
                    onClick={() => handleGradeSelect(grade)}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            className="survey-button action"
            onClick={handleEducationStep}
          >
            Далее
          </button>
        </div>
      ) : step === 2 ? (
        <div>
          <h2 className="survey-title">Выберите от 3 до 10 преимуществ</h2>
          <p className="survey-counter">
            Выбрано: {selectedBenefits.length} (минимум 3, максимум 10)
          </p>
          
          <div className="survey-section">
            {randomizedBenefits.map((benefit) => (
              <button
                key={benefit}
                className={`survey-button ${
                  selectedBenefits.includes(benefit) ? 'selected' : ''
                }`}
                onClick={() => handleBenefitSelection(benefit)}
              >
                {benefit}
              </button>
            ))}
            {selectedBenefits.filter(b => b.startsWith("Другое:")).map((benefit) => (
              <button
                key={benefit}
                className="survey-button selected"
                onClick={() => {
                  setSelectedBenefits(selectedBenefits.filter(b => b !== benefit));
                }}
              >
                {benefit}
              </button>
            ))}
          </div>

          {showCustomInput && (
            <div className="survey-section">
              <input
                className="survey-input"
                value={customBenefit}
                onChange={(e) => setCustomBenefit(e.target.value)}
                placeholder="Введите своё преимущество"
              />
              <button 
                className="survey-button action"
                onClick={handleAddCustomBenefit}
              >
                Добавить
              </button>
            </div>
          )}

          <button 
            className="survey-button action"
            onClick={handleBenefitsStep}
            disabled={selectedBenefits.length < 3}
          >
            Далее ({selectedBenefits.length} {
              selectedBenefits.length === 1 ? 'преимущество' : 
              selectedBenefits.length < 5 ? 'преимущества' : 'преимуществ'
            })
          </button>
        </div>
      ) : step === 3 ? (
        <div>
          <h2 className="survey-title">Расставьте приоритеты выбранным преимуществам</h2>
          <p className="survey-subtitle">
            1 - самый важный приоритет, {selectedBenefits.length} - наименее важный
          </p>

          <div className="survey-section">
            {selectedBenefits.map((benefit) => (
              <div key={benefit} className="rating-card">
                <div className="rating-title">{benefit}</div>
                <div className="rating-status">
                  {ratings[benefit] ? `Приоритет: ${ratings[benefit]}` : 'Не оценено'}
                </div>
                <div className="rating-buttons">
                  {Array.from(
                    {length: selectedBenefits.length}, 
                    (_, i) => i + 1
                  ).map((rating) => (
                    <button
                      key={rating}
                      className={`rating-button ${
                        ratings[benefit] === rating ? 'selected' : ''
                      }`}
                      onClick={() => handleRatingChange(benefit, rating)}
                      disabled={!isRatingAvailable(rating) && ratings[benefit] !== rating}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="survey-button"
              onClick={() => setStep(2)}
            >
              Назад
            </button>
            <button 
              className="survey-button action"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(ratings).length !== selectedBenefits.length}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Отправка...
                </>
              ) : (
                'Отправить'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="survey-section" style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 className="survey-title">Спасибо за участие в опросе! Ваши ответы сохранены.</h2>
        </div>
      )}
      
      {error && step !== 4 && (
        <div className="survey-error">{error}</div>
      )}
    </div>
  );
};

export default Survey;