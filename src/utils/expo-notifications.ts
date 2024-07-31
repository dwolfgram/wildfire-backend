import { Expo } from "expo-server-sdk"

export const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
})

export const isExpoPushToken = (token: string) => Expo.isExpoPushToken(token)
