import { useEffect, useState, createContext, useContext, useRef } from 'react';
import {
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../estilos';
import Toast from 'react-native-toast-message';

const ListContext = createContext(null);

export default function ListScreen({ navigation, route }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState([]);
  
  // Estado para armazenar o último contacto excluído e controlar o tempo da opção "Desfazer"
  const [deletedContact, setDeletedContact] = useState(null);
  const undoTimeoutRef = useRef(null);

  const atualizarLista = async () => {
    setBusy(true);

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
      });

      if (response.ok) {
        const resultado = await response.json();
        
        if (Array.isArray(resultado)) {
          setData(resultado);
        } else if (resultado && Array.isArray(resultado.data)) {
          setData(resultado.data);
        } else if (resultado && Array.isArray(resultado.contatos)) {
          setData(resultado.contatos);
        } else {
          setData([]);
        }
      } else {
        const errorText = await response.text();
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: errorText || 'Não foi possível buscar os contatos.',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Houve um erro ao buscar os dados de rede.',
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    atualizarLista();
  }, []);

  useEffect(() => {
    if (route.params?.atualizar) {
      atualizarLista();
      navigation.setParams({ atualizar: undefined });
    }
  }, [route.params?.atualizar]);

  // Função para registar o contacto apagado e agendar o fecho do aviso após 6 segundos
  const handleContactDeleted = (contact) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setDeletedContact(contact);

    undoTimeoutRef.current = setTimeout(() => {
      setDeletedContact(null);
    }, 6000); // Exibe a opção de desfazer durante 6 segundos
  };

  // Função para re-cadastrar/restaurar o contacto na API
  const handleDesfazer = async () => {
    if (!deletedContact) return;

    setBusy(true);
    const contactoParaRestaurar = {
      name: deletedContact.name,
      phone: deletedContact.phone,
    };

    // Limpa a barra temporária
    setDeletedContact(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
        body: JSON.stringify(contactoParaRestaurar),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: 'Contato restaurado com sucesso!',
          position: 'bottom',
        });
        atualizarLista();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Não foi possível restaurar o contato.',
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Houve um erro ao tentar restaurar o contato.',
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ListContext.Provider
        value={{ setBusy, atualizarLista, navigation, handleContactDeleted }}
      >
        <View style={localStyles.topo}>
          <Text style={{ fontSize: 24, marginBottom: 5 }}>
            Todos os seus contatos estão aqui
          </Text>

          <Text style={{ fontSize: 16, color: '#666', marginBottom: 15, fontWeight: 'bold' }}>
            {Array.isArray(data) && data.length > 0
              ? `Total: ${data.length} ${data.length === 1 ? 'contato' : 'contatos'}`
              : 'Nenhum contato cadastrado'}
          </Text>

          <Button
            title="Novo contato"
            onPress={() => navigation.navigate('add')}
          />

          {/* Banner/Snack-bar de Desfazer Exclusão */}
          {deletedContact && (
            <View style={localStyles.undoBanner}>
              <Text style={localStyles.undoText}>
                "{deletedContact.name}" foi removido.
              </Text>
              <TouchableOpacity onPress={handleDesfazer}>
                <Text style={localStyles.undoButton}>DESFAZER</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            style={{ marginTop: 15 }}
            refreshControl={
              <RefreshControl
                refreshing={busy}
                onRefresh={atualizarLista}
              />
            }
            data={Array.isArray(data) ? data : []}
            renderItem={({ item }) => <ItemLista item={item} />}
            keyExtractor={(item) => String(item.id)}
          />
        </View>
      </ListContext.Provider>
    </SafeAreaView>
  );
}

const ItemLista = ({ item }) => {
  const context = useContext(ListContext);

  const handleEditar = () => {
    context.navigation.navigate('edit', { id: item.id });
  };

  const handleRemover = () => {
    Alert.alert(
      'Excluir entrada',
      'Deseja realmente excluir esta entrada?',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            context.setBusy(true);

            try {
              const url = `${process.env.EXPO_PUBLIC_API_URL}${item.id}`;

              const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                  'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
                },
              });

              if (response.ok) {
                // Notifica o componente pai sobre o contacto eliminado para ativar o botão Desfazer
                context.handleContactDeleted(item);

                Toast.show({
                  type: 'success',
                  text1: 'Sucesso',
                  text2: 'Contato excluído.',
                  position: 'bottom',
                });
                context.atualizarLista();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: 'Falha ao excluir o contato.',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.log(error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Houve um erro ao remover o contato.',
                position: 'bottom',
              });
            } finally {
              context.setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={localStyles.item}>
      <View style={{ flex: 1 }}>
        <Text style={localStyles.nome}>{item.name}</Text>
        <Text style={localStyles.telefone}>{item.phone}</Text>
      </View>

      <View style={localStyles.botoes}>
        <Button title="Editar" onPress={handleEditar} />
        <Button
          title="Remover"
          color="crimson"
          onPress={handleRemover}
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  topo: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  telefone: {
    fontSize: 16,
    color: '#666',
  },
  botoes: {
    flexDirection: 'row',
    columnGap: 8,
  },
  undoBanner: {
    backgroundColor: '#323232',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  undoButton: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
  },
});