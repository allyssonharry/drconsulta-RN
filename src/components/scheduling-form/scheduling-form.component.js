import { yupResolver } from '@hookform/resolvers/yup'
import { NavigationContext } from '@react-navigation/native'
import { formatISO, isWeekend } from 'date-fns'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import DatePicker from 'react-native-date-picker'
import { Masks } from 'react-native-mask-input'
import { AlertModal } from '~components/alert-modal'
import { Button } from '~components/button'
import { Input } from '~components/input'
import { useApp } from '~contexts/app.context'
import api from '~services/api'
import { fieldValidationSchema } from '~utils/field-validation-schama.util'
import formatDate, {
  DATE_SCHEMA_FORMAT,
  DATE_SHORT_SCHEMA_FORMAT,
  HOUR_SHORT_SCHEMA_FORMAT,
} from '~utils/format-date.util'

import {
  Container,
  FormContent,
  FormSection,
  FormSectionTitle,
  HStack,
  HStackSep,
  InputGroup,
  Picker,
  PickerBadge,
} from './styles'

export function SchedulingForm({ catName }) {
  const [scheduling, setScheduling] = useState(new Date())
  const [openPicker, setOpenPicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alertError, setAlertError] = useState(false)
  const [alertInfo, setAlertInfo] = useState(false)
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(fieldValidationSchema),
  })
  const { platform } = useApp()

  const navigation = useContext(NavigationContext)

  useEffect(() => {
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SchedulingSuccess' }],
      })
    }
  }, [success, navigation])

  async function onSubmit(data) {
    setLoading(true)

    const postSchema = {
      scheduling: {
        category: catName,
        datetime: formatDate(scheduling, DATE_SCHEMA_FORMAT),
        createdAt: formatISO(Date.now()),
      },
      personal: {
        fullname: await data.fullname,
        cpf: await data.cpf,
        birthday: await data.birthday,
        phone: await data.phone,
      },
      debug: {
        platform,
      },
    }

    const response = await fetch(api.WEBHOOK_UNIQUE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postSchema),
    })

    if (response.ok) {
      setSuccess(true)
      setLoading(false)
    }

    setAlertError(true)
    setLoading(false)
  }

  return (
    <Container>
      <FormSection>
        <FormSectionTitle>Data e Horário</FormSectionTitle>
        <FormContent>
          <HStack>
            <Picker onPress={() => setOpenPicker(true)} activeOpacity={0.8}>
              <PickerBadge>
                {formatDate(scheduling, DATE_SHORT_SCHEMA_FORMAT)}
              </PickerBadge>
            </Picker>
            <HStackSep>às</HStackSep>
            <Picker onPress={() => setOpenPicker(true)} activeOpacity={0.8}>
              <PickerBadge>
                {formatDate(scheduling, HOUR_SHORT_SCHEMA_FORMAT)}
              </PickerBadge>
            </Picker>
          </HStack>
          <DatePicker
            modal
            open={openPicker}
            date={scheduling}
            mode="datetime"
            title="Qual o dia e hora da consulta?"
            confirmText="Confirmar"
            cancelText="Cancelar"
            minimumDate={new Date()}
            onConfirm={selectedDate => {
              if (isWeekend(selectedDate)) {
                setAlertInfo(true)
                setOpenPicker(false)
              } else {
                setScheduling(selectedDate)
                setOpenPicker(false)
              }
            }}
            onCancel={() => {
              setOpenPicker(false)
            }}
          />
        </FormContent>
      </FormSection>
      <FormSection>
        <FormSectionTitle>Dados Pessoais</FormSectionTitle>
        <FormContent pointerEvents={loading ? 'none' : 'auto'}>
          <Input
            name="fullname"
            placeholder="Nome completo"
            control={control}
            disabled={loading}
          />
          <Input
            name="cpf"
            placeholder="CPF"
            control={control}
            mask={Masks.BRL_CPF}
            keyboardType="numeric"
            disabled={loading}
          />
          <Input
            name="birthday"
            placeholder="Nascimento"
            control={control}
            mask={Masks.DATE_DDMMYYYY}
            keyboardType="numeric"
            disabled={loading}
          />
          <InputGroup>
            <Input
              name="phone"
              placeholder="Telefone"
              control={control}
              mask={Masks.BRL_PHONE}
              keyboardType="numeric"
              disabled={loading}
            />
          </InputGroup>
          <Button
            label={loading ? 'Agendando, aguarde...' : 'Agendar consulta'}
            variant="success"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          />
        </FormContent>
      </FormSection>
      <AlertModal
        variant="DANGER"
        title="Erro ao agendar consulta"
        content="Tente novamente em alguns instantes"
        onPress={() => setAlertError(false)}
        isVisible={alertError}
      />
      <AlertModal
        variant="INFO"
        title="Agendamento"
        content="Não é possível agendar em finais de semana"
        onPress={() => {
          setAlertInfo(false)
          setTimeout(() => {
            setOpenPicker(true)
          }, 300)
        }}
        isVisible={alertInfo}
      />
    </Container>
  )
}

SchedulingForm.propTypes = {
  catName: PropTypes.string.isRequired,
}
