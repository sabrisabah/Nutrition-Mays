// Utility functions for time and date formatting

/**
 * Format date to Gregorian (Miladi) format
 * @param {string} dateString - Date in ISO format or any valid date string
 * @returns {string} - Formatted date in DD/MM/YYYY format
 */
export const formatDateGregorian = (dateString) => {
  if (!dateString) return '--'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--'
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '--'
  }
}

/**
 * Format date to Gregorian (Miladi) format with Arabic month names
 * @param {string} dateString - Date in ISO format or any valid date string
 * @returns {string} - Formatted date with Arabic month names
 */
export const formatDateGregorianArabic = (dateString) => {
  if (!dateString) return '--'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--'
    
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    
    return `${day} ${monthNames[month]} ${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '--'
  }
}

/**
 * Format time from 24-hour format to 12-hour format with Arabic AM/PM
 * @param {string} timeString - Time in format "HH:mm" or "HH:mm:ss"
 * @returns {string} - Formatted time in 12-hour format with Arabic period
 */
export const formatTime12Hour = (timeString) => {
  if (!timeString) return '--'
  
  try {
    // Handle different time formats
    const timePart = timeString.split(' ')[0] // Remove any AM/PM if present
    const [hours, minutes] = timePart.split(':')
    const hour24 = parseInt(hours)
    const min = parseInt(minutes)
    
    let period = ''
    let displayHour = hour24
    
    if (hour24 < 12) {
      period = 'صباحاً'
      if (hour24 === 0) displayHour = 12
    } else {
      period = 'مساءً'
      if (hour24 > 12) displayHour = hour24 - 12
    }
    
    return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return '--'
  }
}

/**
 * Format time from 24-hour format to 12-hour format with English AM/PM
 * @param {string} timeString - Time in format "HH:mm" or "HH:mm:ss"
 * @returns {string} - Formatted time in 12-hour format with English period
 */
export const formatTime12HourEnglish = (timeString) => {
  if (!timeString) return '--'
  
  try {
    const timePart = timeString.split(' ')[0]
    const [hours, minutes] = timePart.split(':')
    const hour24 = parseInt(hours)
    const min = parseInt(minutes)
    
    let period = ''
    let displayHour = hour24
    
    if (hour24 < 12) {
      period = 'AM'
      if (hour24 === 0) displayHour = 12
    } else {
      period = 'PM'
      if (hour24 > 12) displayHour = hour24 - 12
    }
    
    return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return '--'
  }
}

/**
 * Convert 12-hour format to 24-hour format for API calls
 * @param {string} time12Hour - Time in 12-hour format with period
 * @returns {string} - Time in 24-hour format "HH:mm"
 */
export const convertTo24Hour = (time12Hour) => {
  if (!time12Hour) return ''
  
  try {
    const [time, period] = time12Hour.split(' ')
    const [hours, minutes] = time.split(':')
    let hour24 = parseInt(hours)
    
    if (period === 'مساءً' || period === 'PM') {
      if (hour24 !== 12) hour24 += 12
    } else if (period === 'صباحاً' || period === 'AM') {
      if (hour24 === 12) hour24 = 0
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`
  } catch (error) {
    console.error('Error converting time:', error)
    return ''
  }
}

/**
 * Generate time slots in 12-hour format
 * @param {number} startHour - Start hour in 24-hour format
 * @param {number} endHour - End hour in 24-hour format
 * @param {number} interval - Interval in minutes
 * @returns {Array} - Array of time slots in 12-hour format
 */
export const generateTimeSlots12Hour = (startHour = 17, endHour = 20, interval = 30) => {
  const slots = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const time12 = formatTime12Hour(time24)
      slots.push({
        value: time24,
        label: time12
      })
    }
  }
  
  return slots
}
