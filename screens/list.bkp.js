import { useEffect, useState, createContext, useContext } from 'react';
import {
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../estilos';
import Toast from 'react-native-toast-message';

const ListContext = createContext(null);

export default function ListScreen({ navigation, route }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState([]);

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
        setData(resultado);
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

  // Carrega a lista na montagem do componente
  useEffect(() => {
    atualizarLista();
  }, []);

  // Verifica se veio uma ordem de atualização via rota (ex: ao voltar de Add ou Edit)
  useEffect(() => {
    if (route.params?.atualizar) {
      atualizarLista();
      // Limpa os parâmetros de rota para evitar chamadas duplicadas
      navigation.setParams({ atualizar: undefined });
    }
  }, [route.params?.atualizar]);

  return (
    <SafeAreaView style={globalStyles.container}>
      <ListContext.Provider value={{ setBusy, atualizarLista, navigation }}>
        <View style={localStyles.topo}>
          <Text style={{ fontSize: 24, marginBottom: 5 }}>
            Todos os seus contatos estão aqui
          </Text>

          {/* Exibição da quantidade de contatos */}
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 15 }}>
            {data.length === 0
              ? 'Nenhum contato cadastrado'
              : `Total: ${data.length} ${data.length === 1 ? 'contato' : 'contatos'}`}
          </Text>

          <Button
            title="Novo contato"
            onPress={() => navigation.navigate('add')}
          />

          <FlatList
            style={{ marginTop: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={busy}
                onRefresh={atualizarLista}
              />
            }
            data={data}
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

              let message = 'Contato removido com sucesso.';
              try {
                const json = await response.text();
                message = json || '123';
              } catch {
                message = await response.text();
              }

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso',
                  text2: message || 'Contato excluído.',
                  position: 'bottom',
                });
                context.atualizarLista();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: message || 'Falha ao excluir o contato.',
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
});