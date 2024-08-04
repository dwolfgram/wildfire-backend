export const isErrorWithMessage = (
  error: unknown
): error is { message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  )
}

export const isErrorWithResponse = (
  error: unknown
): error is { response: any } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response: unknown }).response === "object"
  )
}
