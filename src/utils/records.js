export const searchRepeated = (records) => {
    if (!records.length == 0) return []
    const repeated = records.filter(record => {
      return records.filter(r => (r.$date == record.$date) && (r.tipo_evento != record.tipo_evento)).length > 1
    })
  
    return repeated;
  }
  
export const sortByDate = (records) => records.sort((a,b) => a.$date-b.$date);
  
export const isUnsorted = (original, sorted) => sorted.filter((record, index) => original.indexOf(record) != index);
  