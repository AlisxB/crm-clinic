Com base nas informações dos arquivos de serviço, aqui está a documentação detalhada dos parâmetros para cada endpoint:

### Endpoints de Agendamento (`/appointments`)

**1. `GET /appointments`**
- **Descrição:** Retorna todos os agendamentos.
- **Parâmetros:** Nenhum.

**2. `GET /appointments/:id`**
- **Descrição:** Retorna um agendamento específico.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do agendamento.

**3. `POST /appointments`**
- **Descrição:** Cria um novo agendamento.
- **Corpo da Requisição (JSON):**
    - `patient_id` (obrigatório): ID do paciente.
    - `dentist_id` (obrigatório): ID do dentista.
    - `start_time` (obrigatório): Data e hora de início do agendamento (formato: `YYYY-MM-DDTHH:MM:SSZ`).
    - `end_time` (obrigatório): Data e hora de término do agendamento (formato: `YYYY-MM-DDTHH:MM:SSZ`).
    - `type` (opcional): Tipo de consulta (ex: "Limpeza", "Extração").
    - `notes` (opcional): Anotações sobre o agendamento.
    - `status` (obrigatório): Status do agendamento (ex: "scheduled", "confirmed", "cancelled").

**4. `PUT /appointments/:id`**
- **Descrição:** Atualiza um agendamento existente.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do agendamento a ser atualizado.
- **Corpo da Requisição (JSON):**
    - `patient_id` (opcional): ID do paciente.
    - `dentist_id` (opcional): ID do dentista.
    - `start_time` (opcional): Data e hora de início.
    - `end_time` (opcional): Data e hora de término.
    - `type` (opcional): Tipo de consulta.
    - `notes` (opcional): Anotações.
    - `status` (opcional): Status do agendamento.

**5. `DELETE /appointments/:id`**
- **Descrição:** Exclui um agendamento.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do agendamento a ser excluído.

---

### Endpoints de Dentista (`/dentists`)

**1. `GET /dentists`**
- **Descrição:** Retorna todos os dentistas.
- **Parâmetros:** Nenhum.

**2. `GET /dentists/active-today`**
- **Descrição:** Retorna os dentistas ativos no dia de hoje.
- **Parâmetros:** Nenhum.

**3. `GET /dentists/available-slots-week`**
- **Descrição:** Retorna os horários disponíveis para a semana.
- **Parâmetros de Query:**
    - `dentistIds` (opcional): String de IDs de dentistas separados por vírgula. Se não for fornecido, retorna para todos os dentistas.

**4. `GET /dentists/:id`**
- **Descrição:** Retorna um dentista específico.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.

**5. `POST /dentists`**
- **Descrição:** Cria um novo dentista.
- **Corpo da Requisição (JSON):**
    - `name` (obrigatório): Nome do dentista.
    - `specialty` (obrigatório): Especialidade principal.
    - `email` (obrigatório): Email do dentista.
    - `phone` (opcional): Telefone do dentista.
    - `experience` (opcional): Anos de experiência.
    - `patients` (opcional): Número de pacientes atendidos.
    - `specializations` (opcional): Array de strings com especializações.

**6. `PUT /dentists/:id`**
- **Descrição:** Atualiza um dentista existente.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.
- **Corpo da Requisição (JSON):** (Todos os campos são opcionais)
    - `name`, `specialty`, `email`, `phone`, `experience`, `patients`, `specializations`

**7. `DELETE /dentists/:id`**
- **Descrição:** Exclui um dentista.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.

**8. `GET /dentists/:id/schedules`**
- **Descrição:** Retorna os horários de atendimento de um dentista.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.

**9. `POST /dentists/:id/schedules`**
- **Descrição:** Cria um novo horário de atendimento para um dentista.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.
- **Corpo da Requisição (JSON):**
    - `day_of_week` (obrigatório): Dia da semana (ex: "Monday", "Tuesday").
    - `start_time` (obrigatório): Hora de início (formato: `HH:MM:SS`).
    - `end_time` (obrigatório): Hora de término (formato: `HH:MM:SS`).
    - `slot_duration_minutes` (obrigatório): Duração do slot em minutos.

**10. `PUT /dentists/:id/schedules/:scheduleId`**
- **Descrição:** Atualiza um horário de atendimento.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.
    - `scheduleId` (obrigatório): O ID do horário.
- **Corpo da Requisição (JSON):** (Todos os campos são opcionais)
    - `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`

**11. `DELETE /dentists/:id/schedules/:scheduleId`**
- **Descrição:** Exclui um horário de atendimento.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.
    - `scheduleId` (obrigatório): O ID do horário.

**12. `GET /dentists/:id/available-slots`**
- **Descrição:** Retorna os horários disponíveis para um dentista em uma data.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do dentista.
- **Parâmetros de Query:**
    - `date` (obrigatório): Data (formato: `YYYY-MM-DD`).

### Endpoints de Finanças (`/finances`)

**1. `GET /finances`**
- **Descrição:** Retorna todos os registros financeiros.
- **Parâmetros:** Nenhum.

**2. `GET /finances/:id`**
- **Descrição:** Retorna um registro financeiro específico.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do registro.

**3. `POST /finances`**
- **Descrição:** Cria um novo registro financeiro.
- **Corpo da Requisição (JSON):**
    - `patient_id` (obrigatório): ID do paciente.
    - `description` (obrigatório): Descrição do registro.
    - `amount` (obrigatório): Valor (numérico).
    - `date` (obrigatório): Data (formato: `YYYY-MM-DD`).
    - `type` (obrigatório): Tipo (ex: "income", "expense").

**4. `PUT /finances/:id`**
- **Descrição:** Atualiza um registro financeiro.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do registro.
- **Corpo da Requisição (JSON):** (Todos os campos são opcionais)
    - `patient_id`, `description`, `amount`, `date`, `type`

**5. `DELETE /finances/:id`**
- **Descrição:** Exclui um registro financeiro.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do registro.

### Endpoints de Paciente (`/patients`)

**1. `GET /patients`**
- **Descrição:** Retorna todos os pacientes.
- **Parâmetros:** Nenhum.

**2. `GET /patients/:id`**
- **Descrição:** Retorna um paciente específico.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do paciente.

**3. `POST /patients`**
- **Descrição:** Cria um novo paciente.
- **Corpo da Requisição (JSON):**
    - `name` (obrigatório): Nome do paciente.
    - `email` (obrigatório): Email do paciente.
    - `phone` (opcional): Telefone.
    - `date_of_birth` (opcional): Data de nascimento (formato: `YYYY-MM-DD`).
    - `address` (opcional): Endereço.
    - `medical_history` (opcional): Histórico médico.
    - `cpf` (opcional): CPF do paciente.

**4. `PUT /patients/:id`**
- **Descrição:** Atualiza um paciente.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do paciente.
- **Corpo da Requisição (JSON):** (Todos os campos são opcionais)
    - `name`, `email`, `phone`, `date_of_birth`, `address`, `medical_history`, `cpf`

**5. `DELETE /patients/:id`**
- **Descrição:** Exclui um paciente.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do paciente.

### Endpoints de Usuário (`/users`)

**1. `GET /users`**
- **Descrição:** Retorna todos os usuários (sem a senha).
- **Parâmetros:** Nenhum.

**2. `POST /users/login`**
- **Descrição:** Autentica um usuário.
- **Corpo da Requisição (JSON):**
    - `username` (obrigatório): Nome de usuário.
    - `password` (obrigatório): Senha.

**3. `GET /users/:id`**
- **Descrição:** Retorna um usuário específico (sem a senha).
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do usuário.

**4. `POST /users`**
- **Descrição:** Cria um novo usuário.
- **Corpo da Requisição (JSON):**
    - `username` (obrigatório): Nome de usuário.
    - `password` (obrigatório): Senha.
    - `name` (obrigatório): Nome do usuário.
    - `role` (obrigatório): Papel (ex: "admin", "dentist", "receptionist").

**5. `PUT /users/:id`**
- **Descrição:** Atualiza um usuário.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do usuário.
- **Corpo da Requisição (JSON):** (Todos os campos são opcionais, exceto a senha que não pode ser atualizada por este endpoint)
    - `username`, `name`, `role`

**6. `DELETE /users/:id`**
- **Descrição:** Exclui um usuário.
- **Parâmetros de Rota:**
    - `id` (obrigatório): O ID do usuário.
