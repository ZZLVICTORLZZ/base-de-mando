import React, { useState, useCallback } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking, Alert, Image } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabaseClient';

export default function OperadoresScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [search, setSearch] = useState('');
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOperadores();
    }, [])
  );

  const fetchOperadores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('operadores').select('*');
    if (error) {
      console.log('Error fetchOperadores:', error);
    } else {
      setOperadores(data || []);
    }
    setLoading(false);
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Sin número', 'Este operador no tiene un número de teléfono registrado.');
      return;
    }
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir la aplicación de llamadas.'));
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) {
      Alert.alert('Sin número', 'Este operador no tiene un número de teléfono registrado.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const waPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const url = `whatsapp://send?phone=${waPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Asegúrate de tener WhatsApp instalado en este dispositivo.');
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const nombre = item.nombre || item.name || 'Sin Nombre';
    const apellidos = item.apellidos || item.last_name || item.apellido || '';
    const nombreCompleto = `${nombre} ${apellidos}`.trim();
    const apodo = item.apodo || '';
    const unidad = item.unidad_asignada || item.eco || item.unidad || 'Sin asignar';
    const telefono = item.telefono || item.phone || item.celular || '';
    const fotoUrl = item.foto_url || '';
    const estatus = item.estatus || item.status || 'Activo';

    const isActivo = estatus.toLowerCase() === 'activo';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Foto de Identificación */}
          <View style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          {/* Datos Personales */}
          <View style={styles.infoContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{nombreCompleto}</Text>
                {apodo ? <Text style={styles.apodoText}>"{apodo}"</Text> : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: isActivo ? '#10b98120' : '#ef444420', borderColor: isActivo ? '#10b98150' : '#ef444450' }]}>
                 <Text style={{ color: isActivo ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 'bold' }}>{estatus}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.unitText}>
              <Feather name="truck" size={13} color="#006847" /> Unidad Actual: <Text style={{ fontWeight: 'bold', color: theme.primary }}>{unidad}</Text>
            </Text>
            
            {telefono ? (
              <Text style={styles.phoneText}>
                <Feather name="phone" size={13} color="#4A4A4A" /> {telefono}
              </Text>
            ) : (
              <Text style={[styles.phoneText, { color: '#ef4444' }]}>Sin número registrado</Text>
            )}
          </View>
        </View>

        {/* Botonera de Contacto */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.callBtn, !telefono && styles.disabledBtn]} 
            onPress={() => handleCall(telefono)}
            disabled={!telefono}
          >
            <Feather name="phone-call" size={18} color={telefono ? theme.headerText : '#64748b'} />
            <Text style={[styles.actionText, !telefono && { color: '#64748b' }]}>Llamar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.waBtn, !telefono && styles.disabledBtn]} 
            onPress={() => handleWhatsApp(telefono)}
            disabled={!telefono}
          >
            <FontAwesome name="whatsapp" size={20} color={telefono ? theme.headerText : '#64748b'} />
            <Text style={[styles.actionText, !telefono && { color: '#64748b' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredOperadores = operadores.filter(op => {
    const term = search.toLowerCase();
    const nombre = (op.nombre || op.name || '').toLowerCase();
    const apellidos = (op.apellidos || op.last_name || op.apellido || '').toLowerCase();
    const apodo = (op.apodo || '').toLowerCase();
    const unidad = (op.unidad_asignada || op.eco || op.unidad || '').toLowerCase();
    return nombre.includes(term) || apellidos.includes(term) || apodo.includes(term) || unidad.includes(term);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Directorio de Operadores</Text>
        <Text style={styles.subtitle}>Gafetes Virtuales Módulo J2</Text>
      </View>

      <View style={styles.filtersContainer}>
        <Feather name="search" size={18} color="#006847" style={styles.filterIcon} />
        <TextInput 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por Nombre, Apodo o ECO..."
          placeholderTextColor="#6B7280"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#006847" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredOperadores}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>
               {operadores.length === 0 ? 'No hay operadores registrados en la base de datos.' : 'No se encontraron coincidencias.'}
             </Text>
          }
        />
      )}
    </View>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.headerText,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  filterIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 14 },

  listPadding: { padding: 20, paddingBottom: 40 },
  
  card: { 
    backgroundColor: theme.headerText, 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1'
  },
  avatarContainer: {
    marginRight: 16,
    justifyContent: 'center'
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.primary
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary
  },
  avatarText: {
    color: theme.primary,
    fontSize: 24,
    fontWeight: 'bold'
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2
  },
  apodoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    fontStyle: 'italic',
    marginBottom: 4
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE1',
    marginVertical: 8
  },
  unitText: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 4
  },
  phoneText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF5'
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8
  },
  callBtn: {
    backgroundColor: '#3b82f6',
    borderRightWidth: 1,
    borderColor: '#F0EBE1'
  },
  waBtn: {
    backgroundColor: '#10b981'
  },
  disabledBtn: {
    backgroundColor: '#EAEAD2',
  },
  actionText: {
    color: theme.headerText,
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
}
