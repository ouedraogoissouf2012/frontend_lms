<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement du quiz...</p>
      </div>

      <!-- Quiz -->
      <div v-else-if="quiz" class="bg-white rounded-lg shadow-lg p-8">
        <!-- En-tête -->
        <div class="mb-8 flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ quiz.title }}</h1>
            <p class="text-gray-600 mt-2">{{ quiz.description }}</p>
          </div>

          <!-- Timer -->
          <div class="bg-primary-100 px-6 py-3 rounded-lg">
            <p class="text-sm text-primary-600">Temps restant</p>
            <p class="text-2xl font-bold text-primary-700">{{ formatTime(timeRemaining) }}</p>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-8">
          <div
            v-for="(question, index) in quiz.questions"
            :key="question.id"
            class="border-b pb-6"
          >
            <h3 class="text-lg font-semibold mb-4">
              Question {{ index + 1 }}: {{ question.question_text }}
              <span class="text-sm text-gray-500">({{ question.points }} pts)</span>
            </h3>

            <!-- Question à choix multiple -->
            <div v-if="question.question_type === 'multiple_choice'" class="space-y-2">
              <label
                v-for="option in question.options"
                :key="option"
                class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  :name="`question-${question.id}`"
                  :value="option"
                  v-model="answers[question.id]"
                  class="mr-3"
                />
                <span>{{ option }}</span>
              </label>
            </div>

            <!-- Question vrai/faux -->
            <div v-else-if="question.question_type === 'true_false'" class="space-y-2">
              <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  :name="`question-${question.id}`"
                  value="true"
                  v-model="answers[question.id]"
                  class="mr-3"
                />
                <span>Vrai</span>
              </label>
              <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  :name="`question-${question.id}`"
                  value="false"
                  v-model="answers[question.id]"
                  class="mr-3"
                />
                <span>Faux</span>
              </label>
            </div>

            <!-- Question texte libre -->
            <div v-else-if="question.question_type === 'short_answer'">
              <textarea
                v-model="answers[question.id]"
                rows="3"
                class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Votre réponse..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="mt-8 flex justify-end">
          <button
            @click="submitQuiz"
            class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Soumettre le quiz
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { quizzes } from '@/services/api'
import { formatElapsed } from '@/utils/formatters'
import { toast } from '@/services/toast'
import { useConfirm } from '@/composables/useConfirm'

export default {
  name: 'QuizTake',
  components: {
    Navbar
  },
  data() {
    return {
      loading: true,
      quiz: null,
      attemptId: null,
      answers: {},
      timeRemaining: 0,
      timer: null
    }
  },
  async mounted() {
    await this.loadQuiz()
    this.startTimer()
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    async loadQuiz() {
      this.loading = true

      try {
        const quizId = this.$route.params.id
        this.quiz = await quizzes.getOne(quizId)

        // Initialiser les réponses vides
        this.quiz.questions.forEach(q => {
          this.answers[q.id] = ''
        })

        // Initialiser le timer
        this.timeRemaining = this.quiz.duration_minutes * 60
      } catch (error) {
        console.error('Erreur chargement quiz:', error)
        toast.error('Impossible de charger le quiz')
        this.$router.push('/quizzes')
      } finally {
        this.loading = false
      }
    },

    startTimer() {
      this.timer = setInterval(() => {
        this.timeRemaining--

        if (this.timeRemaining <= 0) {
          clearInterval(this.timer)
          toast.info('Temps écoulé ! Le quiz va être soumis automatiquement.')
          this.submitQuiz()
        }
      }, 1000)
    },

    formatTime(seconds) {
      // Durée écoulée mm:ss — délègue au formatter centralisé (#23)
      return formatElapsed(seconds)
    },

    async submitQuiz() {
      if (!(await useConfirm().confirm({ message: 'Êtes-vous sûr de vouloir soumettre le quiz ?' }))) {
        return
      }

      try {
        // Formater les réponses
        const formattedAnswers = Object.keys(this.answers).map(questionId => ({
          question_id: parseInt(questionId),
          answer: this.answers[questionId]
        }))

        await quizzes.submitAttempt(this.attemptId, formattedAnswers)

        toast.success('Quiz soumis avec succès !')
        this.$router.push('/quizzes')
      } catch (error) {
        console.error('Erreur soumission quiz:', error)
        toast.error('Erreur lors de la soumission du quiz')
      }
    }
  }
}
</script>
