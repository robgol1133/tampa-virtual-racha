# ⚽ Tampa Virtual do Racha

Aplicativo mobile em React Native para organizar o futebol amador: cadastro de jogadores, controle de presença e sorteio de times equilibrados.

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** no celular (Android/iOS) — ou emulador

### Instalação

```bash
# 1. Acesse a pasta do projeto
cd TampaVirtualRacha

# 2. Instale as dependências
npm install

# 3. Inicie o servidor Expo
npx expo start

# 4. Escaneie o QR Code com o Expo Go
#    (Android) ou câmera (iOS)
```

---

## 📱 Funcionalidades

### Cadastro de Jogadores
- Nome, idade e nível de habilidade (1–5 estrelas)
- Classificação automática: Iniciante → Amador → Regular → Bom → Craque
- Dados salvos localmente (AsyncStorage — persiste entre sessões)

### Controle de Presença
- Botão de confirmação por jogador
- Filtro entre "Todos" e "Confirmados"
- Contador de presentes no topo

### Sorteio de Times
- Sorteio aleatório dos jogadores confirmados
- Até **3 times** com no máximo **10 jogadores** cada
- Distribuição equilibrada em rodízio
- Modal com resultado colorido por time

### Remoção de Jogadores
- Botão de exclusão com confirmação via Alert
- Remoção imediata da lista e do armazenamento

---

## 🎨 Design

- **Tema escuro** (Dark Mode nativo)
- Paleta: Verde neon `#00E676`, fundo `#0A0E1A`
- Animações de entrada nos cards (slide + fade + spring)
- FAB verde para adicionar jogadores
- Badges de nível coloridos por habilidade

---

## 📁 Estrutura

```
TampaVirtualRacha/
├── App.js          ← Código principal (único arquivo)
├── app.json        ← Config Expo
├── package.json    ← Dependências
└── README.md
```

---

## 🔧 Dependências principais

| Pacote | Uso |
|--------|-----|
| `react-native` | Framework mobile |
| `expo` | Toolchain e build |
| `@react-native-async-storage/async-storage` | Persistência local |

---

## 📝 Regras do Sorteio

- Apenas jogadores **confirmados** participam
- Distribuição em **rodízio** (0→time1, 1→time2, 2→time3, 3→time1...)
- Máximo de **3 times**, cada um com até **10 jogadores**
- Embaralhamento aleatório antes da distribuição

---

Feito com ❤️ para o futebol racha 🥅
