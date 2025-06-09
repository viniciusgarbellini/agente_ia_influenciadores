require('dotenv').config();
const axios = require('axios');

function detectarCidade(texto) {
    const cidades = [
        "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Curitiba",
        "Porto Alegre", "Salvador", "Recife", "Fortaleza", "Manaus", "Belém", "Osasco"
    ];
    for (let cidade of cidades) {
        if (texto.toLowerCase().includes(cidade.toLowerCase())) {
            return cidade;
        }
    }
    return "São Paulo";
}

async function getWeather(city) {
    return {
        description: "céu limpo",
        temp: 26,
        humidity: 60,
        alert: false
    };
}

async function getFloodStatus(city) {
    if (city.toLowerCase() === "osasco") {
        return {
            flood: true,
            report: "🚨 Alerta: Alagamento confirmado na região central de Osasco. Evite circular pelas áreas da Av. dos Autonomistas e proximidades da estação de trem."
        };
    }
    return { flood: false, report: `Nenhum registro de alagamento em ${city}.` };
}

async function getNearbyShelter(city) {
    const exampleShelters = {
        "Osasco": "Abrigo Municipal do Centro, Rua da Esperança, 120 - 500m do centro",
        "São Paulo": "Escola Estadual João Lima, Rua das Palmeiras, 1200 - 1.3km de distância",
        "Belo Horizonte": "Centro Comunitário BH, Av. Amazonas, 3300 - 900m de distância",
        "Rio de Janeiro": "Ginásio Municipal RJ, Av. Atlântica, 1400 - 800m de distância"
    };
    return exampleShelters[city] || "Nenhum abrigo cadastrado para essa cidade.";
}

async function getGPTResponse(userMessage) {
    const apiKey = process.env.OPENAI_API_KEY;

    const cidade = detectarCidade(userMessage);
    const weather = await getWeather(cidade);
    const shelter = await getNearbyShelter(cidade);
    const flood = await getFloodStatus(cidade);

    // Novo número fictício para contato
    const numeroEmergencia = "(11) 99999-0000";

    // Mensagem de orientação para influenciadores
    let orientacao = `Em caso de enchente ou desastre natural em ${cidade}, oriente seus seguidores a:\n`;
    orientacao += "- Evitar áreas alagadas e buscar abrigo seguro.\n";
    orientacao += "- Seguir as orientações da Defesa Civil local.\n";
    orientacao += `- Em caso de emergência, envie mensagem para o número ${numeroEmergencia}.\n`;
    if (flood.flood) {
        orientacao += `- Alerta de alagamento: ${flood.report}\n`;
        orientacao += `- Indique o abrigo mais próximo: ${shelter}\n`;
    }

    const prompt = `Você é um assistente para influenciadores digitais. Sugira um conteúdo de até 200 caracteres para ser postado nas redes sociais, alertando a população sobre desastres naturais, incluindo o número de contato para emergências e orientações práticas.

[INFORMAÇÕES]
Cidade: ${cidade}
Clima: ${weather.description}, ${weather.temp}°C, umidade ${weather.humidity}%.
${flood.report}

[ORIENTAÇÕES]
${orientacao}

[PERGUNTA]
${userMessage}

[RESPOSTA]
`;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4",
            messages: [
                { role: "system", content: "Você é um assistente para influenciadores digitais, especialista em comunicação de emergências e desastres naturais no Brasil." },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Erro na API do GPT:", error.message);
        return "⚠️ Erro ao gerar sugestão de conteúdo. Tente novamente mais tarde.";
    }
}

module.exports = { getGPTResponse };
