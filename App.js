import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Animated, Modal, ScrollView,
  StatusBar, Platform, Dimensions, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ─── Cores do app ──────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgInput: '#1C2333',
  green: '#00E676',
  greenDark: '#00C853',
  greenMuted: '#1A3A28',
  yellow: '#FFD600',
  red: '#FF4444',
  redMuted: '#3A1A1A',
  blue: '#4FC3F7',
  text: '#FFFFFF',
  textMuted: '#8899AA',
  textDim: '#4A5568',
  border: '#1E2D40',
  gold: '#FFB300',
  silver: '#90A4AE',
  team1: '#00E676',
  team2: '#4FC3F7',
  team3: '#FF6D00',
  team4: '#C084FC',
};

// ─── Utilitários ───────────────────────────────────────────────────────────────
const anoAtual = new Date().getFullYear();

const calcularIdade = (anoNascimento) => {
  const ano = parseInt(anoNascimento);
  if (!ano || isNaN(ano)) return null;
  return anoAtual - ano;
};

const anoValido = (anoNascimento) => {
  const ano = parseInt(anoNascimento);
  return !isNaN(ano) && ano >= 1940 && ano <= anoAtual - 5;
};

// ─── Componente: Estrelas ──────────────────────────────────────────────────────
const StarRating = ({ value, onChange, size = 22 }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange && onChange(i)} activeOpacity={0.7}>
          <Text style={{ fontSize: size, color: i <= value ? COLORS.yellow : COLORS.textDim }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Componente: Badge de nível ─────────────────────────────────────────────────
const LevelBadge = ({ stars }) => {
  const levels = {
    1: { label: 'Iniciante', color: '#78909C' },
    2: { label: 'Amador', color: '#4FC3F7' },
    3: { label: 'Regular', color: '#00E676' },
    4: { label: 'Bom', color: '#FFD600' },
    5: { label: 'Craque', color: '#FF6D00' },
  };
  const lvl = levels[stars] || levels[1];
  return (
    <View style={[styles.badge, { backgroundColor: lvl.color + '22', borderColor: lvl.color + '55' }]}>
      <Text style={[styles.badgeText, { color: lvl.color }]}>{lvl.label}</Text>
    </View>
  );
};

// ─── Componente: Card do Jogador ────────────────────────────────────────────────
const PlayerCard = ({ player, onDelete, onTogglePresence, onEdit, animDelay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  const presenceColor = player.presente ? COLORS.green : COLORS.textDim;
  const cardBorder = player.presente ? COLORS.greenMuted : COLORS.border;

  return (
    <Animated.View style={[
      styles.playerCard,
      { borderColor: cardBorder, opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
    ]}>
      {/* Barra lateral de status */}
      <View style={[styles.playerCardSidebar, { backgroundColor: player.presente ? COLORS.green : COLORS.textDim }]} />

      <View style={styles.playerCardContent}>
        {/* Info principal */}
        <View style={styles.playerCardTop}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerAvatarText}>
              {player.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.playerName} numberOfLines={1}>{player.nome}</Text>
            <Text style={styles.playerAge}>
              {calcularIdade(player.anoNascimento) ?? player.idade} anos
              {player.anoNascimento ? ` · ${player.anoNascimento}` : ''}
            </Text>
          </View>
          <LevelBadge stars={player.estrelas} />
        </View>

        {/* Estrelas */}
        <View style={styles.playerCardMid}>
          <StarRating value={player.estrelas} size={18} />
        </View>

        {/* Ações */}
        <View style={styles.playerCardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.presenceBtn, { borderColor: presenceColor }]}
            onPress={() => onTogglePresence(player.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: presenceColor }]}>
              {player.presente ? '✓ Confirmado' : '○ Ausente'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => onEdit(player)}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>✎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => {
              Alert.alert(
                'Remover Jogador',
                `Deseja remover ${player.nome} da lista?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Remover', style: 'destructive', onPress: () => onDelete(player.id) },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Componente: Modal de Sorteio ───────────────────────────────────────────────
const SorteioModal = ({ visible, times, reserva3, reserva4, onClose }) => {
  const teamColors = [COLORS.team1, COLORS.team2, COLORS.team3, COLORS.team4];
  const teamNames = ['⚡ Time 1', '💧 Time 2', '🔥 Time 3 (Reserva)', '💜 Time 4 (Reserva)'];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚽ Sorteio dos Times</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(reserva3 || reserva4) && (
              <View style={styles.sorteioBanner}>
                <Text style={styles.sorteioBannerText}>
                  ℹ️ Times 1 e 2 foram equilibrados por estrelas e idade.
                  {reserva3 ? ' Time 3 formado pelos confirmados após o 20º.' : ''}
                  {reserva4 ? ' Time 4 formado pelos confirmados após o 30º.' : ''}
                </Text>
              </View>
            )}
            {times.map((time, idx) => (
              <View key={idx} style={[styles.teamCard, { borderColor: teamColors[idx] + '55' }]}>
                <View style={[styles.teamHeader, { backgroundColor: teamColors[idx] + '22' }]}>
                  <Text style={[styles.teamName, { color: teamColors[idx] }]}>{teamNames[idx]}</Text>
                  <View style={[styles.teamCountBadge, { backgroundColor: teamColors[idx] + '33' }]}>
                    <Text style={[styles.teamCountText, { color: teamColors[idx] }]}>
                      {time.length} jogadores
                    </Text>
                  </View>
                </View>
                {time.map((p, pIdx) => (
                  <View key={p.id} style={[styles.teamPlayer, pIdx < time.length - 1 && styles.teamPlayerBorder]}>
                    <View style={[styles.teamPlayerNum, { backgroundColor: teamColors[idx] + '22' }]}>
                      <Text style={[styles.teamPlayerNumText, { color: teamColors[idx] }]}>{pIdx + 1}</Text>
                    </View>
                    <Text style={styles.teamPlayerName}>{p.nome}</Text>
                    <StarRating value={p.estrelas} size={13} />
                  </View>
                ))}
              </View>
            ))}

            {times.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>😅</Text>
                <Text style={styles.emptyStateText}>Nenhum jogador confirmado!</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeModalBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeModalBtnText}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Componente: Modal de Cadastro ──────────────────────────────────────────────
const CadastroModal = ({ visible, onClose, onSave, jogadorEditando }) => {
  const isEdicao = !!jogadorEditando;
  const [nome, setNome] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');
  const [estrelas, setEstrelas] = useState(3);

  // Idade calculada em tempo real conforme o usuário digita o ano
  const idadeCalculada = anoValido(anoNascimento) ? calcularIdade(anoNascimento) : null;

  useEffect(() => {
    if (jogadorEditando) {
      setNome(jogadorEditando.nome);
      // Suporte a jogadores antigos cadastrados com idade direta
      setAnoNascimento(
        jogadorEditando.anoNascimento
          ? String(jogadorEditando.anoNascimento)
          : jogadorEditando.idade
            ? String(anoAtual - jogadorEditando.idade)
            : ''
      );
      setEstrelas(jogadorEditando.estrelas);
    } else {
      setNome('');
      setAnoNascimento('');
      setEstrelas(3);
    }
  }, [jogadorEditando, visible]);

  const handleSave = () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome do jogador.');
    if (!anoValido(anoNascimento))
      return Alert.alert('Atenção', `Informe um ano de nascimento válido (1940 a ${anoAtual - 5}).`);
    const idade = calcularIdade(anoNascimento);
    onSave({ nome: nome.trim(), anoNascimento: parseInt(anoNascimento), idade, estrelas });
    setNome(''); setAnoNascimento(''); setEstrelas(3);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdicao ? '✎ Editar Jogador' : '➕ Novo Jogador'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isEdicao && (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerText}>
                Editando dados de {jogadorEditando.nome}
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: João Silva"
              placeholderTextColor={COLORS.textDim}
              maxLength={30}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Ano de Nascimento</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                style={[styles.input, { width: 110 }]}
                value={anoNascimento}
                onChangeText={setAnoNascimento}
                placeholder="Ex: 1995"
                placeholderTextColor={COLORS.textDim}
                keyboardType="number-pad"
                maxLength={4}
              />
              {idadeCalculada !== null && (
                <View style={styles.idadeTag}>
                  <Text style={styles.idadeTagText}>{idadeCalculada} anos</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nível de Habilidade</Text>
            <View style={{ marginTop: 8, marginBottom: 10 }}>
              <StarRating value={estrelas} onChange={setEstrelas} size={30} />
            </View>
            <LevelBadge stars={estrelas} />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isEdicao && styles.saveBtnEdit]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>
              {isEdicao ? '✓ Salvar Alterações' : 'Cadastrar Jogador'}
            </Text>
          </TouchableOpacity>

          {isEdicao && (
            <TouchableOpacity style={styles.cancelEditBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelEditBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── App Principal ──────────────────────────────────────────────────────────────
export default function App() {
  const [jogadores, setJogadores] = useState([]);
  const [showCadastro, setShowCadastro] = useState(false);
  const [showSorteio, setShowSorteio] = useState(false);
  const [jogadorEditando, setJogadorEditando] = useState(null);
  const [times, setTimes] = useState([]);
  const [sorteioInfo, setSorteioInfo] = useState({ reserva3: false, reserva4: false });
  const [filtro, setFiltro] = useState('todos'); // todos | presentes
  const [busca, setBusca] = useState('');
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadJogadores();
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadJogadores = async () => {
    try {
      const data = await AsyncStorage.getItem('@racha_jogadores');
      if (data) setJogadores(JSON.parse(data));
    } catch (e) {}
  };

  const saveJogadores = async (lista) => {
    try {
      await AsyncStorage.setItem('@racha_jogadores', JSON.stringify(lista));
    } catch (e) {}
  };

  const addJogador = (jogador) => {
    const novo = { ...jogador, id: Date.now().toString(), presente: false };
    const nova = [...jogadores, novo];
    setJogadores(nova);
    saveJogadores(nova);
  };

  const deleteJogador = (id) => {
    const nova = jogadores.filter(j => j.id !== id);
    setJogadores(nova);
    saveJogadores(nova);
  };

  const editJogador = (jogador) => {
    setJogadorEditando(jogador);
    setShowCadastro(true);
  };

  const salvarEdicao = (dados) => {
    if (jogadorEditando) {
      const nova = jogadores.map(j =>
        j.id === jogadorEditando.id ? { ...j, ...dados } : j
      );
      setJogadores(nova);
      saveJogadores(nova);
      setJogadorEditando(null);
    } else {
      addJogador(dados);
    }
  };

  const togglePresenca = (id) => {
    const nova = jogadores.map(j => {
      if (j.id !== id) return j;
      const confirmando = !j.presente;
      return {
        ...j,
        presente: confirmando,
        // Grava o momento exato da confirmação; remove ao desconfirmar
        confirmedAt: confirmando ? Date.now() : null,
      };
    });
    setJogadores(nova);
    saveJogadores(nova);
  };

  const realizarSorteio = () => {
    // Filtrar confirmados e ordenar pelo momento exato de confirmação (do mais antigo ao mais recente)
    const presentes = jogadores
      .filter(j => j.presente)
      .sort((a, b) => (a.confirmedAt || 0) - (b.confirmedAt || 0));

    if (presentes.length < 2) {
      return Alert.alert('Atenção', 'Confirme pelo menos 2 jogadores para realizar o sorteio!');
    }

    // Separar por ordem de confirmação (quem confirmou primeiro fica nos times principais):
    // 1º ao 20º  → Time 1 e Time 2 (equilibrados por estrelas e idade)
    // 21º ao 30º → Time 3 (reserva)
    // 31º+       → Time 4 (reserva)
    const principais = presentes.slice(0, 20);
    const reserva3   = presentes.slice(20, 30);
    const reserva4   = presentes.slice(30);

    // Ordenar os principais por score (estrelas têm mais peso que idade)
    // para distribuição equilibrada via serpentina
    const ordenados = [...principais].sort((a, b) => {
      const scoreA = a.estrelas * 10 + (a.idade / 10);
      const scoreB = b.estrelas * 10 + (b.idade / 10);
      return scoreB - scoreA; // maior score primeiro
    });

    // Distribuição em serpentina: garante equilíbrio entre os dois times
    // Posição: 0→T1, 1→T2, 2→T2, 3→T1, 4→T1, 5→T2 ...
    const time1 = [];
    const time2 = [];
    ordenados.forEach((j, i) => {
      const rodada = Math.floor(i / 2);
      const posNaRodada = i % 2;
      if (rodada % 2 === 0) {
        posNaRodada === 0 ? time1.push(j) : time2.push(j);
      } else {
        posNaRodada === 0 ? time2.push(j) : time1.push(j);
      }
    });

    // Montar resultado final
    const resultado = [time1, time2];
    const hasReserva3 = reserva3.length > 0;
    const hasReserva4 = reserva4.length > 0;
    if (hasReserva3) resultado.push(reserva3);
    if (hasReserva4) resultado.push(reserva4);

    setTimes(resultado);
    setSorteioInfo({ reserva3: hasReserva3, reserva4: hasReserva4 });
    setShowSorteio(true);
  };

  const presentes = jogadores.filter(j => j.presente);
  const ausentes = jogadores.filter(j => !j.presente);
  const listaPorFiltro =
    filtro === 'presentes' ? presentes :
    filtro === 'ausentes'  ? ausentes  :
    jogadores;
  const listaFiltrada = busca.trim() === ''
    ? listaPorFiltro
    : listaPorFiltro.filter(j =>
        j.nome.toLowerCase().includes(busca.toLowerCase().trim())
      );

  const statsTotal = jogadores.length;
  const statsPresentes = presentes.length;
  const statsAusentes = ausentes.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerAnim }] }]}>
        <View style={styles.headerLogo}>
          <Text style={styles.headerLogoIcon}>⚽</Text>
          <View>
            <Text style={styles.headerTitle}>Tampa Virtual</Text>
            <Text style={styles.headerSubtitle}>do Racha</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <Text style={styles.statChipNum}>{statsTotal}</Text>
            <Text style={styles.statChipLabel}>jogadores</Text>
          </View>
          <View style={[styles.statChip, { borderColor: COLORS.green + '55' }]}>
            <Text style={[styles.statChipNum, { color: COLORS.green }]}>{statsPresentes}</Text>
            <Text style={styles.statChipLabel}>confirmados</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Botão Sorteio ── */}
      <View style={styles.sorteioRow}>
        <TouchableOpacity style={styles.sorteioBtn} onPress={realizarSorteio} activeOpacity={0.85}>
          <Text style={styles.sorteioBtnIcon}>🎲</Text>
          <Text style={styles.sorteioBtnText}>Sortear Times</Text>
          <View style={styles.sorteioBadge}>
            <Text style={styles.sorteioBadgeText}>{statsPresentes}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Busca ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar jogador..."
            placeholderTextColor={COLORS.textDim}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.searchClear}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filtros ── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'todos' && styles.filterBtnActive]}
          onPress={() => setFiltro('todos')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterBtnText, filtro === 'todos' && styles.filterBtnTextActive]}>
            Todos ({statsTotal})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'presentes' && styles.filterBtnActive]}
          onPress={() => setFiltro('presentes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterBtnText, filtro === 'presentes' && styles.filterBtnTextActive]}>
            ✓ Confirmados ({statsPresentes})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'ausentes' && styles.filterBtnActiveRed]}
          onPress={() => setFiltro('ausentes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterBtnText, filtro === 'ausentes' && styles.filterBtnTextRed]}>
            ○ Ausentes ({statsAusentes})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Lista ── */}
      <FlatList
        data={listaFiltrada}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>
              {busca ? '🔎' : filtro === 'ausentes' ? '✅' : '🏟️'}
            </Text>
            <Text style={styles.emptyStateText}>
              {busca
                ? `Nenhum resultado para "${busca}"`
                : filtro === 'presentes'
                  ? 'Nenhum jogador confirmado'
                  : filtro === 'ausentes'
                    ? 'Nenhum jogador ausente'
                    : 'Nenhum jogador cadastrado'}
            </Text>
            <Text style={styles.emptyStateHint}>
              {busca
                ? 'Tente outro nome'
                : filtro === 'presentes'
                  ? 'Confirme presença na lista completa'
                  : filtro === 'ausentes'
                    ? 'Todos os jogadores estão confirmados!'
                    : 'Toque em + para adicionar jogadores'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <PlayerCard
            player={item}
            onDelete={deleteJogador}
            onTogglePresence={togglePresenca}
            onEdit={editJogador}
            animDelay={index * 60}
          />
        )}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCadastro(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* ── Modals ── */}
      <CadastroModal
        visible={showCadastro}
        onClose={() => { setShowCadastro(false); setJogadorEditando(null); }}
        onSave={salvarEdicao}
        jogadorEditando={jogadorEditando}
      />
      <SorteioModal
        visible={showSorteio}
        times={times}
        reserva3={sorteioInfo.reserva3}
        reserva4={sorteioInfo.reserva4}
        onClose={() => setShowSorteio(false)}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogoIcon: { fontSize: 36 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerStats: { flexDirection: 'row', gap: 8 },
  statChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statChipNum: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statChipLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: -2 },

  // Sorteio
  sorteioRow: { paddingHorizontal: 16, paddingVertical: 12 },
  sorteioBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sorteioBtnIcon: { fontSize: 20 },
  sorteioBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.3,
  },
  sorteioBadge: {
    backgroundColor: '#000000aa',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sorteioBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.green },

  // Busca
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
  },
  searchClear: {
    padding: 4,
    marginLeft: 6,
  },
  searchClearText: {
    fontSize: 13,
    color: COLORS.textDim,
    fontWeight: '700',
  },

  // Filtros
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.greenMuted, borderColor: COLORS.green },
  filterBtnActiveRed: { backgroundColor: COLORS.redMuted, borderColor: COLORS.red + '88' },
  filterBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  filterBtnTextActive: { color: COLORS.green },
  filterBtnTextRed: { color: COLORS.red },

  // Lista
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Player Card
  playerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  playerCardSidebar: { width: 4 },
  playerCardContent: { flex: 1, padding: 14 },
  playerCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.green },
  playerName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  playerAge: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  playerCardMid: { marginBottom: 12 },
  playerCardActions: { flexDirection: 'row', gap: 8 },

  // Badge
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Botões de ação
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  presenceBtn: { flex: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  deleteBtn: {
    borderColor: COLORS.red + '55',
    backgroundColor: COLORS.redMuted,
    paddingHorizontal: 14,
  },
  deleteBtnText: { fontSize: 14, color: COLORS.red, fontWeight: '800' },
  editBtn: {
    borderColor: COLORS.blue + '55',
    backgroundColor: '#0D2233',
    paddingHorizontal: 14,
  },
  editBtnText: { fontSize: 15, color: COLORS.blue, fontWeight: '800' },
  editBanner: {
    backgroundColor: COLORS.blue + '18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.blue + '44',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  editBannerText: { fontSize: 13, color: COLORS.blue, fontWeight: '600' },
  saveBtnEdit: { backgroundColor: COLORS.blue },
  cancelEditBtn: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelEditBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  idadeTag: {
    backgroundColor: COLORS.greenMuted,
    borderWidth: 1,
    borderColor: COLORS.green + '55',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  idadeTagText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
  },
  sorteioBanner: {
    backgroundColor: '#1a2a3a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.blue + '44',
    padding: 12,
    marginBottom: 14,
  },
  sorteioBannerText: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '500',
    lineHeight: 18,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.green,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { fontSize: 30, color: '#000', fontWeight: '300', marginTop: -2 },

  // Modal base
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  modalContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '700' },

  // Form
  formGroup: { marginBottom: 18 },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },

  // Modal Sorteio
  teamCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  teamName: { fontSize: 15, fontWeight: '800' },
  teamCountBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  teamCountText: { fontSize: 12, fontWeight: '700' },
  teamPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  teamPlayerBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  teamPlayerNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamPlayerNumText: { fontSize: 12, fontWeight: '800' },
  teamPlayerName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  closeModalBtn: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeModalBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateIcon: { fontSize: 56, marginBottom: 12 },
  emptyStateText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 },
  emptyStateHint: { fontSize: 13, color: COLORS.textDim, textAlign: 'center' },
});
