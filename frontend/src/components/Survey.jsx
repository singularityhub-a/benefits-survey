import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import { Loader2 } from 'lucide-react';
import '../styles/survey.css';

const Survey = () => {
  // Шаги: 0 - имя/фамилия/почта, 1 - выбор категории и класса, 2 - дополнительные вопросы для 9 класса,
  // 2.5 - дополнительные вопросы для родителей, 3 - выбор преимуществ, 4 - ранжирование, 5 - благодарность
  const [step, setStep] = useState(0);
  
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    educationType: '', // школа, колледж, вуз, родитель
    grade: '', // для школьников
    postNinthGradePlan: '', // планы после 9 класса
    customPostNinthGradePlan: '', // для варианта "другое"
    consideringDirection: '', // направление, которое рассматривает
    childEducationStatus: '' // для родителей - в каком классе/учебном заведении учится ребенок
  });
  
  const [benefitsByCategory, setBenefitsByCategory] = useState({});
  const [categoriesOrder, setCategoriesOrder] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [customBenefit, setCustomBenefit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [ratings, setRatings] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [randomizedNinthGradePlans, setRandomizedNinthGradePlans] = useState([]);

  // Варианты образования
  const educationTypes = ["Школа", "Колледж", "ВУЗ", "Я - родитель"];
  
  // Варианты классов
  const grades = ["7 класс", "8 класс", "9 класс", "10 класс", "11 класс"];

  const course = ["1 курс", "2 курс", "3 курс", "4 курс", "5 курс"];
  
  // Варианты планов после 9 класса
  const postNinthGradePlans = [
    "Остаться в своей школе",
    "Пойти в колледж",
    "Перейти в другую школу",
    "Никуда не пойду",
    "Буду работать",
    "Пока не решил(а)",
    "Другое"
  ];

  // Варианты для статуса ребенка родителя
  const childEducationOptions = [
    "5 класс", "6 класс", "7 класс", "8 класс", "9 класс", 
    "10 класс", "11 класс", "Уже учится в колледже", "Уже учится в ВУЗе"
  ];

  useEffect(() => {
    const loadBenefits = async () => {
      try {
        const response = await fetch('/benefits.csv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            // Группируем преимущества по категориям
            const benefitsGrouped = {};
            
            results.data.forEach(row => {
              if (row.benefit && row.category) {
                if (!benefitsGrouped[row.category]) {
                  benefitsGrouped[row.category] = [];
                }
                benefitsGrouped[row.category].push(row.benefit);
              }
            });
            
            // Перемешиваем преимущества внутри каждой категории
            Object.keys(benefitsGrouped).forEach(category => {
              benefitsGrouped[category] = _.shuffle(benefitsGrouped[category]);
            });
            
            // Сохраняем категории в случайном порядке
            const shuffledCategories = _.shuffle(Object.keys(benefitsGrouped));
            
            // Инициализируем все категории как свернутые
            const initialExpandedState = {};
            shuffledCategories.forEach(category => {
              initialExpandedState[category] = false; // false - категория свернута
            });
            initialExpandedState["Свой вариант"] = false;
            
            setBenefitsByCategory(benefitsGrouped);
            setCategoriesOrder(shuffledCategories);
            setExpandedCategories(initialExpandedState);
            
            // Рандомизируем планы после 9 класса, но оставляем "другое" в конце
            const regularPlans = postNinthGradePlans.filter(p => p !== "Другое");
            setRandomizedNinthGradePlans([..._.shuffle(regularPlans), "Другое"]);
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
      grade: ''
    }));
  };

  const handleGradeSelect = (grade) => {
    setPersonalInfo(prev => ({
      ...prev,
      grade: grade
    }));
  };

  const handlePostNinthGradePlanSelect = (plan) => {
    setPersonalInfo(prev => ({
      ...prev,
      postNinthGradePlan: plan,
      customPostNinthGradePlan: plan !== "другое" ? "" : prev.customPostNinthGradePlan
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

    if (
      (personalInfo.educationType === "Школа" ||
       personalInfo.educationType === "Колледж" ||
       personalInfo.educationType === "ВУЗ") && !personalInfo.grade
    ) {
      setError(`Пожалуйста, выберите ${personalInfo.educationType === 'Школа' ? 'класс' : 'курс'}`);
      return;
    }

    setError('');
    
    // Если выбрана школа и 9 класс, переходим на дополнительный шаг для 9 класса
    if (personalInfo.educationType === "Школа" && personalInfo.grade === "9 класс") {
      setStep(2);
    } 
    // Если выбран вариант "Я - родитель", переходим на дополнительный шаг для родителей
    else if (personalInfo.educationType === "Я - родитель") {
      setStep(2.5);
    } else {
      setStep(3); // Изменили с 2 на 3
    }
  };
  
  const handlePostNinthGradeStep = () => {
    if (!personalInfo.postNinthGradePlan) {
      setError('Пожалуйста, выберите один из вариантов');
      return;
    }
    
    if (personalInfo.postNinthGradePlan === "Другое" && !personalInfo.customPostNinthGradePlan.trim()) {
      setError('Пожалуйста, укажите свой вариант');
      return;
    }
    
    setError('');
    setStep(3); // Изменили с 2 на 3
  };

  const handleChildEducationSelect = (status) => {
    setPersonalInfo(prev => ({
      ...prev,
      childEducationStatus: status
    }));
  };

  const handleParentStep = () => {
    if (!personalInfo.childEducationStatus) {
      setError('Пожалуйста, выберите класс/статус обучения вашего ребенка');
      return;
    }
    
    setError('');
    setStep(3);
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

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const countSelectedInCategory = (category) => {
    return benefitsByCategory[category]?.filter(benefit => 
      selectedBenefits.includes(benefit)
    ).length || 0;
  };

  const handleBenefitsStep = () => {
    if (selectedBenefits.length < 3) {
      setError('Пожалуйста, выберите минимум 3 преимущества');
      return;
    }
    setError('');
    setStep(4); // Изменили с 3 на 4
  };

  const handleRatingChange = (benefit, rating) => {
    setError('');
    
    // Если пользователь нажимает на уже выбранный ранг, удаляем его
    if (ratings[benefit] === rating) {
      const newRatings = { ...ratings };
      delete newRatings[benefit];
      setRatings(newRatings);
      return;
    }
    
    // Если этот ранг уже назначен другому преимуществу, удаляем его оттуда
    const benefitWithCurrentRating = Object.entries(ratings).find(([_, value]) => value === rating);
    if (benefitWithCurrentRating) {
      const [oldBenefit] = benefitWithCurrentRating;
      if (oldBenefit !== benefit) {
        const newRatings = { ...ratings };
        delete newRatings[oldBenefit];
        setRatings(newRatings);
      }
    }
    
    // Назначаем новый ранг выбранному преимуществу
    setRatings({
      ...ratings,
      [benefit]: rating
    });
  };

  const isRatingAvailable = (benefit, rating) => {
    // Ранг доступен, если он не используется никем или если он уже назначен текущему преимуществу
    return !Object.values(ratings).includes(rating) || ratings[benefit] === rating;
  };
  
  const handleSubmit = async () => {
    if (Object.keys(ratings).length !== selectedBenefits.length) {
        setError('Пожалуйста, оцените все выбранные преимущества');
        return;
    }

    setIsSubmitting(true);
    setLoadingMessage("⏳ Отправка данных... Пожалуйста, не перезагружайте страницу.");
    setError('');

    // Формируем информацию о месте обучения с учетом статуса родителя
    let institutionInfo;
    
    if (personalInfo.educationType === "Я - родитель") {
      institutionInfo = `${personalInfo.educationType}, ребенок: ${personalInfo.childEducationStatus}`;
    } else {
      // Формируем информацию о месте обучения с учетом дополнительных данных для 9 класса
      institutionInfo = personalInfo.educationType + (personalInfo.grade ? `, ${personalInfo.grade}` : '');
      
      // Добавляем информацию о планах после 9 класса, если она есть
      if (personalInfo.postNinthGradePlan) {
        const postNinthPlan = personalInfo.postNinthGradePlan === "Другое" 
          ? `Другое: ${personalInfo.customPostNinthGradePlan}` 
          : personalInfo.postNinthGradePlan;
        
        institutionInfo += `, планы: ${postNinthPlan}`;
      }
      
      // Добавляем информацию о направлении, если она есть
      if (personalInfo.consideringDirection) {
        institutionInfo += `, направление: ${personalInfo.consideringDirection}`;
      }
    }


    const data = {
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: personalInfo.email,
        institution: institutionInfo,
        benefits: selectedBenefits.map((benefit) => ({
            benefit: benefit,
            priority: ratings[benefit]
        }))
    };

    try {
        const response = await fetch('https://benefits-survey-czag.onrender.com/api/survey/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            setError('Ошибка при отправке данных: ' + JSON.stringify(errorData));
            return;
        }

        setLoadingMessage("");
        setStep(5);  // Изменили с 4 на 5
    } catch (error) {
        setError('Ошибка: ' + error.message);
        setLoadingMessage("");
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

          {(personalInfo.educationType === "Школа" || personalInfo.educationType === "Колледж" || personalInfo.educationType === "ВУЗ") && (
            <div className="survey-section">
              <label className="survey-subtitle">
                {personalInfo.educationType === "Школа" ? "Класс" : "Курс"}
              </label>
              <div className="survey-section">
                {(personalInfo.educationType === "Школа" ? grades : course).map(level => (
                  <button
                    key={level}
                    className={`survey-button ${personalInfo.grade === level ? 'selected' : ''}`}
                    onClick={() => handleGradeSelect(level)}
                  >
                    {level}
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
      ) : step === 2.5 ? (
        <div className="survey-section">
          <h2 className="survey-title">Информация о вашем ребенке</h2>
          
          <div className="survey-section">
            <label className="survey-subtitle">В каком классе/учебном заведении учится ваш ребенок?</label>
            <div className="survey-section">
              {childEducationOptions.map(option => (
                <button
                  key={option}
                  className={`survey-button ${personalInfo.childEducationStatus === option ? 'selected' : ''}`}
                  onClick={() => handleChildEducationSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
      
          <button 
            className="survey-button action"
            onClick={handleParentStep}
          >
            Далее
          </button>
        </div>
      ) : step === 2 ? (
        <div className="survey-section">
          <h2 className="survey-title">Вопросы для учеников 9 класса</h2>
          
          <div className="survey-section">
            <label className="survey-subtitle">Ты уже решил(а), что будешь делать после 9 класса?</label>
            <div className="survey-section">
              {randomizedNinthGradePlans.map(plan => (
                <button
                  key={plan}
                  className={`survey-button ${personalInfo.postNinthGradePlan === plan ? 'selected' : ''}`}
                  onClick={() => handlePostNinthGradePlanSelect(plan)}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {personalInfo.postNinthGradePlan === "Другое" && (
            <div className="survey-section">
              <input
                className="survey-input"
                placeholder="Укажите свой вариант"
                value={personalInfo.customPostNinthGradePlan}
                onChange={handlePersonalInfoChange('customPostNinthGradePlan')}
              />
            </div>
          )}

          {(personalInfo.postNinthGradePlan === "Остаться в своей школе" || 
            personalInfo.postNinthGradePlan === "Пойти в колледж" || 
            personalInfo.postNinthGradePlan === "Перейти в другую школу") && (
            <div className="survey-section">
              <label className="survey-subtitle">Какое направление ты рассматриваешь сейчас?</label>
              <input
                className="survey-input"
                placeholder=" "
                value={personalInfo.consideringDirection}
                onChange={handlePersonalInfoChange('consideringDirection')}
              />
            </div>
          )}

          <button 
            className="survey-button action"
            onClick={handlePostNinthGradeStep}
          >
            Далее
          </button>
        </div>
      ) : step === 3 ? (
        <div>
          <h2 className="survey-title">Отметьте от 3 до 10 качеств идеального для ВАС учебного заведения</h2>
          <p className="survey-counter">
            Выбрано: {selectedBenefits.length} (минимум 3, максимум 10)
          </p>
          

          <div className="benefits-categories">
            {categoriesOrder.map(category => {
              const selectedCount = countSelectedInCategory(category);
              return (
                <div key={category} className="benefit-category">
                 
                  <div 
                    className="category-header" 
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="category-title-wrapper">
                      <h3 className="category-title">
                        {category}
                        {selectedCount > 0 && <span className="selected-count"> ({selectedCount})</span>}
                      </h3>
                    </div>
                    <span className="category-toggle">
                      {expandedCategories[category] ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {expandedCategories[category] && (
                    <div className="category-benefits">
                      {benefitsByCategory[category]?.map(benefit => (
                        <button
                          key={benefit}
                          className={`survey-button ${selectedBenefits.includes(benefit) ? 'selected' : ''}`}
                          onClick={() => handleBenefitSelection(benefit)}
                        >
                          {benefit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Категория "Свой вариант" */}
            <div className="benefit-category">
            
              <div 
                className="category-header" 
                onClick={() => toggleCategory("Свой вариант")}
              >
                <div className="category-title-wrapper">
                  <h3 className="category-title">
                    Свой вариант
                    {getCustomBenefitsCount() > 0 && 
                      <span className="selected-count"> ({getCustomBenefitsCount()})</span>
                    }
                  </h3>
                </div>
                <span className="category-toggle">
                  {expandedCategories["Свой вариант"] ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedCategories["Свой вариант"] && (
                <div className="category-benefits">
                  <button
                    className="survey-button"
                    onClick={() => handleBenefitSelection("Другое")}
                  >
                    Другое
                  </button>
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
              )}
            </div>
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
      ) : step === 4 ? (
        <div>
          <h2 className="survey-title">Расположите выбранные качества по степени важности для Вас</h2>
          <p className="survey-subtitle">
            1 — самое важное качество, {selectedBenefits.length} - наименее важное
          </p>
          <p className="survey-instruction">
            для того, чтобы присвоить уже выбранную оценку другому качеству, сначала отмените текущую оценку у соответствующего качества повторным нажатием
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
                      disabled={!isRatingAvailable(benefit, rating)}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

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
      ) : (
        <div className="survey-section" style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 className="survey-title">Спасибо за участие в опросе! Ваши ответы сохранены.</h2>
        </div>
      )}
      
      {error && step !== 5 && (
        <div className="survey-error">{error}</div>
      )}
      {loadingMessage && (
        <div className="loading-warning">
            {loadingMessage}
        </div>
       )}
    </div>
  );
};

export default Survey;
