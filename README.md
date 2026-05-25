# ⚽ Tampa Virtual do Racha

Aplicativo mobile em React Native/Expo para organizar o futebol amador: cadastro de jogadores, controle de presença, sorteio de times equilibrado e compartilhamento do resultado.

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- App **Expo Go** instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Instalação

```bash
# 1. Acesse a pasta do projeto
cd TampaVirtualRacha

# 2. Instale as dependências
npm install --legacy-peer-deps

# 3. Ajuste as versões compatíveis com o Expo SDK
npx expo install expo-sharing

# 4. Inicie o servidor Expo limpando o cache
npx expo start --clear

# 5. Escaneie o QR Code com o Expo Go (Android) ou câmera (iOS)
```

---

## 📱 Funcionalidades

### ➕ Cadastro de Jogadores
- Informe o **nome**, **ano de nascimento** e **nível de habilidade** (1 a 5 estrelas)
- A **idade é calculada automaticamente** com base no ano de nascimento
- Classificação automática por nível:
  - ⭐ Iniciante · ⭐⭐ Amador · ⭐⭐⭐ Regular · ⭐⭐⭐⭐ Bom · ⭐⭐⭐⭐⭐ Craque
- Dados salvos localmente com **AsyncStorage** — persistem entre sessões

### ✎ Edição de Jogadores
- Botão de edição `✎` em cada card
- Permite alterar nome, ano de nascimento e estrelas
- Campos preenchidos automaticamente com os dados atuais

### ✓ Controle de Presença
- Botão individual de confirmação por jogador
- Registra o **momento exato** da confirmação (usado na lógica do sorteio)
- Indicador visual na lateral do card (verde = confirmado)

### 🔍 Busca de Jogadores
- Campo de busca em tempo real por nome
- Funciona combinado com os filtros
- Botão `✕` para limpar a busca rapidamente

### 🗂 Filtros
- **Todos** — exibe todos os jogadores cadastrados
- **✓ Confirmados** — apenas quem confirmou presença
- **○ Ausentes** — apenas quem ainda não confirmou

### 🎲 Sorteio de Times
- Apenas jogadores **confirmados** participam
- Respeita a **ordem de confirmação** — quem confirmou primeiro fica nos times principais
- Distribuição por ordem de chegada:

| Posição na fila | Destino |
|---|---|
| 1º ao 20º confirmado | ⚡ Time 1 e 💧 Time 2 (equilibrados) |
| 21º ao 30º confirmado | 🔥 Time 3 (Reserva) |
| 31º em diante | 💜 Time 4 (Reserva) |

- Times 1 e 2 equilibrados por **estrelas e idade** via distribuição em serpentina

### 📤 Compartilhar Resultado
- Botão **📤 Compartilhar Resultado** no topo do modal de sorteio
- Captura o resultado completo como **imagem PNG**
- Abre o menu nativo do celular para enviar via WhatsApp, Drive, Telegram, salvar na galeria, etc.
- A imagem inclui cabeçalho com nome do app e rodapé de identificação

### 🗑 Remoção de Jogadores
- Botão `✕` com confirmação via Alert antes de excluir
- Remoção imediata da lista e do armazenamento local

---

## 🎨 Design

- **Tema escuro** nativo (Dark Mode)
- Paleta: Verde neon `#00E676` · Fundo `#0A0E1A`
- Animações de entrada nos cards (slide + fade + spring)
- FAB verde flutuante para adicionar jogadores
- Badges de nível coloridos por habilidade
- Times com cores distintas: Verde · Azul · Laranja · Roxo

---

## 📁 Estrutura do Projeto

```
TampaVirtualRacha/
├── App.js              ← Código principal (único arquivo)
├── app.json            ← Configuração Expo
├── package.json        ← Dependências
├── babel.config.js     ← Configuração Babel
├── README.md           ← Este arquivo
└── assets/
    ├── icon.png            ← Ícone do app (1024x1024)
    ├── adaptive-icon.png   ← Ícone adaptativo Android (1024x1024)
    ├── splash.png          ← Tela de carregamento (1242x2436)
    └── favicon.png         ← Favicon web (48x48)
```

---

## 🔧 Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| `expo` | ~54.0.0 | Toolchain e build |
| `react-native` | 0.76.5 | Framework mobile |
| `react` | 18.2.0 | Biblioteca UI |
| `expo-status-bar` | ~2.2.0 | Barra de status |
| `@react-native-async-storage/async-storage` | ~2.1.0 | Persistência local |
| `react-native-view-shot` | ~4.0.0 | Captura de tela como imagem |
| `expo-sharing` | ~14.0.8 | Compartilhamento nativo |

---

## 📦 Gerando o APK (Android)

### Opção 1 — EAS Build (Recomendado, sem Android Studio)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar o projeto
eas build:configure

# Gerar APK para teste
eas build -p android --profile preview

# Gerar AAB para a Play Store
eas build -p android --profile production
```

### Opção 2 — Build Local (Requer Android Studio)

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
# APK gerado em: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🏪 Publicando na Google Play Store

1. Criar conta em [play.google.com/console](https://play.google.com/console) (taxa única de U$ 25)
2. Gerar o AAB com `eas build -p android --profile production`
3. Criar o app no Console e preencher a ficha da loja
4. Fazer upload do `.aab` e enviar para revisão

> ⚠️ O campo `android.package` no `app.json` é permanente após a primeira publicação. Escolha com cuidado.

---

## 📝 Versionamento

O versionamento é controlado no `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

| Campo | Descrição |
|---|---|
| `version` | Versão legível (ex: `1.0.0`, `1.1.0`, `2.0.0`) |
| `versionCode` | Número inteiro, deve ser incrementado a cada build enviado à Play Store |

---

Feito com ❤️ para o futebol racha 🥅
