export const getOneWeekAgoDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date
}
