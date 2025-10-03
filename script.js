document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const countrySelect = document.getElementById('countrySelect');
    const yearInput = document.getElementById('yearInput');
    const searchButton = document.getElementById('searchButton');
    const holidaysList = document.getElementById('holidaysList');
    const errorSection = document.getElementById('error-message');
    const errorMessageText = document.getElementById('errorMessageText');
    const buttonText = document.getElementById('buttonText');
    const loader = document.getElementById('loader');

    const API_BASE_URL = 'https://date.nager.at/api/v3';

    // Armazenar nomes dos países para exibição posterior
    let countryNames = {};

    // --- Funções de Estado (UI) ---

    const displayError = (message) => {
        errorSection.classList.remove('loader-hidden');
        errorMessageText.textContent = message;
        holidaysList.innerHTML = ''; 
    };

    const hideError = () => {
        errorSection.classList.add('loader-hidden');
    };

    const toggleLoading = (isLoading) => {
        searchButton.disabled = isLoading;
        if (isLoading) {
            buttonText.textContent = 'Buscando...';
            loader.classList.remove('loader-hidden');
        } else {
            buttonText.textContent = 'Buscar Feriados';
            loader.classList.add('loader-hidden');
        }
    };


    // --- Funções da API e de Dados ---

    // 1. Carrega a lista de países (códigos)
    const loadCountries = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/AvailableCountries`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar países: ${response.status}`);
            }
            const countries = await response.json();
            
            // Popula countryNames e o <select>
            countries.sort((a, b) => a.name.localeCompare(b.name)).forEach(country => {
                const option = document.createElement('option');
                option.value = country.countryCode;
                option.textContent = country.name; // Nome em inglês, conforme API
                countrySelect.appendChild(option);
                countryNames[country.countryCode] = country.name;
            });

            countrySelect.value = 'BR'; // Pré-seleciona Brasil

        } catch (error) {
            console.error('Erro ao carregar a lista de países:', error);
            displayError('Não foi possível carregar a lista de países para o seletor. Tente recarregar a página.');
        }
    };

    // 2. Busca e exibe os feriados
    const fetchHolidays = async () => {
        hideError();
        holidaysList.innerHTML = ''; 
        
        const countryCode = countrySelect.value;
        const year = yearInput.value;

        if (!countryCode || !year) {
            displayError('Por favor, selecione um País e informe um Ano.');
            return;
        }

        toggleLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
            
            if (response.status === 404) {
                 throw new Error(`Código do País ou Ano Inválido. Não há dados para ${countryCode}/${year}.`);
            }

            if (!response.ok) {
                throw new Error(`Falha na busca da API: ${response.statusText}`);
            }

            const holidays = await response.json();
            displayHolidays(holidays, countryCode);

        } catch (error) {
            console.error('Erro ao buscar feriados:', error);
            displayError(`Erro ao buscar os feriados: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    };

    // 3. Renderiza os feriados no DOM
    const displayHolidays = (holidays, countryCode) => {
        const countryName = countryNames[countryCode] || countryCode;
        
        if (holidays.length === 0) {
            holidaysList.innerHTML = `<p>Nenhum feriado público encontrado para ${countryName} no ano selecionado.</p>`;
            return;
        }

        holidaysList.innerHTML = ''; // Limpa antes de adicionar
        
        // TÍTULO GRANDE E MARCANTE (AGORA SEM "Jogadas de Descanso")
        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = `Feriados de ${countryName} em ${yearInput.value}`;
        holidaysList.appendChild(resultsTitle);


        holidays.forEach(holiday => {
            const card = document.createElement('div');
            card.className = 'holiday-card drop-shadow';

            // 1. CORREÇÃO DA DATA: Ajuste de fuso horário
            const dateStr = holiday.date + "T12:00:00"; 
            const dateObj = new Date(dateStr);
            
            // Formata a data para pt-BR
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // 2. CORREÇÃO DO 'TIPO UNDEFINED'
            const isGlobal = holiday.global;
            let typeInfo = '';
            if (isGlobal === true) {
                typeInfo = 'Feriado Público Nacional';
            } else if (isGlobal === false) {
                typeInfo = 'Feriado Regional / Local';
            } else {
                typeInfo = 'Informação de Tipo Indisponível';
            }
            
            // TRADUÇÃO/NOME ALTERNATIVO
            const localName = holiday.localName || holiday.name;
            const englishName = holiday.name;
            
            let subTitle = '';
            
            // Adiciona a tradução/nome alternativo APENAS se for diferente do nome local
            if (localName.toLowerCase() !== englishName.toLowerCase()) {
                // Usa a classe CSS 'small-translation' para estilo discreto
                subTitle = `<p class="small-translation">Nome original (EN): <em>${englishName}</em></p>`;
            }
            
            card.innerHTML = `
                <h3>${localName}</h3>
                ${subTitle}
                <p><span class="holiday-date">${formattedDate}</span></p>
                <p>Tipo: ${typeInfo}</p>
                ${holiday.counties ? `<p style="font-size: 0.8em; color: var(--court-side);">Localidades: ${holiday.counties.join(', ')}</p>` : ''}
            `;

            holidaysList.appendChild(card);
        });
    };


    // --- Inicialização e Event Listeners ---
    
    // Configura o evento do botão
    searchButton.addEventListener('click', fetchHolidays);

    // Carrega a lista de países ao iniciar
    loadCountries();
});