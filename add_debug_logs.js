const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/admin/AdminEvaluationDetails.vue');
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `  try {
    const evaluationId = route.params.id
    const response = await api.get(\`/evaluations/\${evaluationId}/results-by-class\`)

    if (response.data.success) {
      evaluation.value = response.data.data.evaluation
      resultats.value = response.data.data.resultats
      statistiques.value = response.data.data.statistiques
    } else {
      error.value = response.data.message || 'Erreur lors du chargement des résultats'
    }
  } catch (err) {
    console.error('Erreur chargement résultats:', err)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des résultats'
  } finally {
    loading.value = false
  }`;

const newCode = `  try {
    const evaluationId = route.params.id
    console.log('🔍 Loading evaluation ID:', evaluationId)
    const response = await api.get(\`/evaluations/\${evaluationId}/results-by-class\`)

    console.log('📦 Full Response:', response)
    console.log('✅ response.data:', response.data)
    console.log('✅ response.data.success:', response.data.success)
    console.log('📊 response.data.data:', response.data.data)

    if (response.data.success) {
      console.log('✅ SUCCESS BRANCH - Assigning data...')
      evaluation.value = response.data.data.evaluation
      resultats.value = response.data.data.resultats
      statistiques.value = response.data.data.statistiques
      console.log('✅ Data assigned successfully:')
      console.log('   - evaluation:', evaluation.value)
      console.log('   - resultats:', resultats.value)
      console.log('   - statistiques:', statistiques.value)
    } else {
      console.log('❌ ELSE BRANCH - Setting error because success is false')
      error.value = response.data.message || 'Erreur lors du chargement des résultats'
    }
  } catch (err) {
    console.error('❌ CATCH BLOCK - Error caught:', err)
    console.error('❌ err.response:', err.response)
    console.error('❌ err.response?.data:', err.response?.data)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des résultats'
  } finally {
    console.log('🏁 Finally block - loading set to false')
    loading.value = false
  }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Debug logs added successfully!');
