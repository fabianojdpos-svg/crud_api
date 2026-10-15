import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../estilos';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';

import { schema, estilosAdd, formatPhone } from './add';

export default function EditScreen({ navigation, route }) {
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const id = route.params?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
    },
    resolver: yupResolver(schema),
  });

  const carregar = async () => {
    if (!id) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Identificador do contato não encontrado.',
        position: 'bottom',
      });
      navigation.goBack();
      return;
    }

    setBusy(true);

    try {
      const url = `${process.env.EXPO_PUBLIC_API_URL}${id}`;

      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
      });

      if (response.ok) {
        const contato = await response.json();

        // Aplica a máscara no número retornado pela API ao popular o formulário
        reset({
          name: contato.name || '',
          phone: formatPhone(contato.phone || ''),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Houve um erro ao buscar o contato.',
          position: 'bottom',
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Houve um erro de rede ao buscar o contato.',
        position: 'bottom',
      });
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const onSubmit = async (data) => {
    setBusy(true);
    Keyboard.dismiss();

    // Limpa espaços em branco nas extremidades dos textos
    const dadosAtualizados = {
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
    };

    try {
      const url = `${process.env.EXPO_PUBLIC_API_URL}${id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
        body: JSON.stringify(dadosAtualizados),
      });

      let message = '';
      try {
        const json = await response.json();
        message = json.message || JSON.stringify(json);
      } catch {
        message = await response.text();
      }

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: message || 'Contato atualizado com sucesso.',
          position: 'bottom',
        });

        navigation.navigate('list', { atualizar: true });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message || 'Não foi possível atualizar o contato.',
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Houve um erro de rede ao atualizar o contato.',
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={globalStyles.container}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>
          Edição de entrada
        </Text>

        <View style={{ marginBottom: 15 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                ref={nameInputRef}
                placeholder="Nome"
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                onChangeText={onChange}
                value={value}
                style={estilosAdd.input}
              />
            )}
          />
          {errors.name && (
            <Text style={estilosAdd.error}>{errors.name.message}</Text>
          )}
        </View>

        <View style={{ marginBottom: 15 }}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                ref={phoneInputRef}
                placeholder="Telefone ex: (17) 99999-8889"
                keyboardType="phone-pad"
                maxLength={15}
                onChangeText={(text) => onChange(formatPhone(text))}
                value={value}
                style={estilosAdd.input}
              />
            )}
          />
          {errors.phone && (
            <Text style={estilosAdd.error}>{errors.phone.message}</Text>
          )}
        </View>

        <ActivityIndicator size="large" animating={busy} color="#0000ff" />

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={busy}
          title={busy ? "Salvando..." : "Salvar"}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}