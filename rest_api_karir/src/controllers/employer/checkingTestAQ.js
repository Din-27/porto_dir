const checkTestAQ = (item) => {
    let score
    // 1
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '1. a') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '1. b') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '1. c') {
        score = 'Climber'
    }
    // 2
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '2. a') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '2. b') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '2. c') {
        score = 'Camper'
    }
    // 3
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '3. a') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '3. b') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '3. c') {
        score = 'Quitter'
    }
    // 4
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '4. a') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '4. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '4. c') {
        score = 'Climber'
    }
    // 5
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '5. a') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '5. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '5. c') {
        score = 'Climber'
    }
    // 6
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '6. a') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '6. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '6. c') {
        score = 'Camper'
    }
    // 7
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '7. a') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '7. b') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '7. c') {
        score = 'Quitter'
    }
    // 8
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '8. a') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '8. b') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '8. c') {
        score = 'Climber'
    }
    // 9
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '9. a') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '9. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '9. c') {
        score = 'Camper'
    }
    // 10
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '10. a') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '10. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '10. c') {
        score = 'Camper'
    }
    // 11
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '11. a') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '11. b') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '11. c') {
        score = 'Climber'
    }
    // 12
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '12. a') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '12. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '12. c') {
        score = 'Camper'
    }
    // 13
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '13. a') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '13. b') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '13. c') {
        score = 'Climber'
    }
    // 14
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '14. a') {
        score = 'Quitter'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '14. b') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '14. c') {
        score = 'Climber'
    }
    // 15
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '15. a') {
        score = 'Camper'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '15. b') {
        score = 'Climber'
    }
    if (`${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban.slice(0, 1).toLowerCase()}` === '15. c') {
        score = 'Quitter'
    }
    return score
}

module.exports = { checkTestAQ }