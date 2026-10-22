import { expect, test } from '@playwright/test'

const setor = { id: 's1', nome: 'Produção' }
const equipamento = { id: 'e1', nome: 'Torno CNC 01', setorId: setor.id, codigoPatrimonio: 'EQP-01', setor }
const tecnico = { id: 't1', nome: 'Maria Souza', matricula: 'T-001', chamadosAltaAbertos: 0 }

const chamadoInicial = {
  id: 'c1', equipamentoId: equipamento.id, equipamento, tecnicoId: null, tecnico: null,
  urgencia: 'Media', tipo: 'Corretiva', status: 'Aberto', descricao: 'Sensor sem sinal',
  criadoEm: '2026-10-22T12:00:00Z', atribuidoEm: null, finalizadoEm: null,
  laudo: null, causaRaiz: null, pecasTrocadas: null, trocas: [],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/setores') ? [setor]
      : path.endsWith('/equipamentos') ? [equipamento]
      : path.endsWith('/tecnicos') ? [tecnico]
      : path.endsWith('/chamados') ? [chamadoInicial]
      : []
    await route.fulfill({ json: body })
  })
})

test('mantém o formulário e a descrição quando a criação do chamado falha', async ({ page }) => {
  await page.route('**/api/chamados', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 422, json: { erro: 'Equipamento indisponível para abertura.' } })
      return
    }
    await route.fallback()
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir Chamado', exact: true }).click()
  await page.locator('form select').first().selectOption(equipamento.id)
  const descricao = page.getByPlaceholder('Descreva o defeito constatado na máquina...')
  await descricao.fill('Descrição que deve ser preservada')
  await page.locator('form button[type=submit]').click()
  await expect(descricao).toBeVisible()
  await expect(descricao).toHaveValue('Descrição que deve ser preservada')
  await expect(page.getByRole('alert')).toContainText('Equipamento indisponível')
})

test('todas as abas cabem na largura de um celular', async ({ page }) => {
  await page.goto('/')
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    for (const aba of ['Quadro de Chamados', 'Carga da Equipe (RN Crítica)', 'Parque Fabril']) {
      await page.getByRole('button', { name: aba, exact: true }).click()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  }
})

test('peças funcionam sem randomUUID e falha na conclusão preserva o preenchimento', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window.crypto, 'randomUUID', { value: undefined }))
  await page.route('**/api/chamados/c1/concluir', (route) => route.fulfill({ status: 422, json: { erro: 'Conclusão recusada.' } }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Concluir Chamado', exact: true }).click()
  await page.getByLabel('Laudo Técnico / Ação Executada').fill('Substituição de componente')
  await page.getByRole('button', { name: 'Adicionar peça', exact: true }).click()
  await page.getByLabel('Nome da peça 1').fill('Sensor')
  await page.getByLabel('Quantidade 1').fill('2')
  await page.getByRole('button', { name: 'Adicionar peça', exact: true }).click()
  await page.getByLabel('Nome da peça 2').fill('Correia')
  await page.getByRole('button', { name: 'Remover peça 1', exact: true }).click()
  await page.getByRole('button', { name: 'Concluir Ordem de Serviço', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Conclusão recusada')
  await expect(page.getByLabel('Nome da peça 1')).toHaveValue('Correia')
})

test('abre detalhes pelo cartão e pelo teclado sem disparar os controles internos', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.ticket-card').filter({ hasText: 'Sensor sem sinal' })
  await card.locator('.ticket-description').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Detalhes do chamado')
  await expect(dialog).toContainText('Sensor sem sinal')
  await expect(dialog).toContainText('EQP-01')
  await page.keyboard.press('Escape')
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await card.getByRole('button', { name: 'Concluir Chamado', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Concluir Chamado')
  await expect(page.getByRole('dialog')).not.toContainText('Detalhes do chamado')
})

test('arraste pede técnico e conclusão pede laudo antes de mudar o status', async ({ page }) => {
  let atribuido = false
  await page.route('**/api/chamados', (route) => route.fulfill({ json: [{
    ...chamadoInicial,
    ...(atribuido ? { status: 'Em Andamento', tecnicoId: tecnico.id, tecnico } : {}),
  }] }))
  await page.route('**/api/chamados/c1/atribuir', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ tecnicoId: tecnico.id })
    atribuido = true
    await route.fulfill({ json: { ...chamadoInicial, status: 'Em Andamento', tecnicoId: tecnico.id, tecnico } })
  })
  await page.goto('/')
  const handle = page.getByRole('button', { name: 'Arrastar chamado c1', exact: true })
  const target = page.locator('[data-status="Em Andamento"]')
  await expect(handle).toBeVisible()
  const sourceBounds = await handle.boundingBox()
  const targetBounds = await target.boundingBox()
  if (!sourceBounds || !targetBounds) throw new Error('Origem ou destino não renderizado')
  await page.mouse.move(sourceBounds.x + sourceBounds.width / 2, sourceBounds.y + sourceBounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBounds.x + 50, targetBounds.y + 70, { steps: 15 })
  await page.mouse.up()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Atribuir chamado')
  expect(atribuido).toBe(false)
  await dialog.getByLabel('Técnico responsável').selectOption(tecnico.id)
  await dialog.getByRole('button', { name: 'Confirmar atribuição', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(target.locator('.ticket-card')).toHaveCount(1)
  await target.locator('.ticket-card').getByRole('button', { name: 'Mover chamado', exact: true }).click()
  await page.getByRole('button', { name: 'Mover para Concluídos', exact: true }).click()
  await expect(dialog).toContainText('Concluir Chamado')
  await expect(dialog.getByLabel('Laudo Técnico / Ação Executada')).toBeVisible()
})

test('atribuição recusada mantém o cartão e o diálogo de atribuição', async ({ page }) => {
  await page.route('**/api/chamados/c1/atribuir', (route) => route.fulfill({ status: 422, json: { erro: 'Limite de chamados Alta atingido.' } }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Mover chamado', exact: true }).click()
  await page.getByRole('button', { name: 'Mover para Em Atendimento', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Técnico responsável').selectOption(tecnico.id)
  await dialog.getByRole('button', { name: 'Confirmar atribuição', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Limite de chamados Alta')
  await expect(page.locator('[data-status="Aberto"] .ticket-card')).toHaveCount(1)
})

test('cartão concluído abre laudo e peças e não oferece movimentos de volta', async ({ page }) => {
  await page.route('**/api/chamados', (route) => route.fulfill({ json: [{
    ...chamadoInicial, status: 'Concluído', laudo: 'Sensor substituído', causaRaiz: 'Falha Elétrica',
    finalizadoEm: '2026-10-22T13:00:00Z',
    trocas: [{ id: 'p1', pecaNome: 'Sensor indutivo', quantidade: 2, observacao: 'Eixo principal', registradoEm: '2026-10-22T13:00:00Z' }],
  }] }))
  await page.goto('/')
  const card = page.locator('.ticket-card')
  await expect(card.getByRole('button', { name: 'Mover chamado', exact: true })).toHaveCount(0)
  await card.locator('.ticket-description').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Sensor substituído')
  await expect(dialog).toContainText('Sensor indutivo')
  await expect(dialog).toContainText('Eixo principal')
  await expect(dialog.getByRole('button', { name: 'Concluir chamado', exact: true })).toHaveCount(0)
})

test.describe('entrada por toque', () => {
  test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } })
  test('arrastar pela alça abre a atribuição em um tablet', async ({ page }) => {
    await page.goto('/')
    const handle = page.getByRole('button', { name: 'Arrastar chamado c1', exact: true })
    await expect(handle).toBeVisible()
    const source = await handle.boundingBox()
    const target = await page.locator('[data-status="Em Andamento"]').boundingBox()
    if (!source || !target) throw new Error('Cartão ou coluna não renderizado')
    const session = await page.context().newCDPSession(page)
    const point = { x: source.x + source.width / 2, y: source.y + source.height / 2 }
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 20, y: point.y }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: target.x + 50, y: target.y + 70 }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.getByRole('dialog')).toContainText('Atribuir chamado')
    await session.detach()
  })
})

for (const cadastro of [
  { botao: 'Equipamento', rota: '/equipamentos', placeholder: 'Ex: Torno CNC 03, Esteira 04...', valor: 'Torno de teste' },
  { botao: 'Setor', rota: '/setores', placeholder: 'Ex: Usinagem, Pintura, Linha 2...', valor: 'Linha de teste' },
]) {
  test(`preserva o cadastro de ${cadastro.botao} quando a API recusa`, async ({ page }) => {
    await page.route(`**/api${cadastro.rota}`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      return route.fulfill({ status: 422, json: { erro: 'Cadastro recusado.' } })
    })
    await page.goto('/')
    await page.getByRole('button', { name: cadastro.botao, exact: true }).click()
    if (cadastro.botao === 'Equipamento') await page.locator('form select').selectOption(setor.id)
    const input = page.getByPlaceholder(cadastro.placeholder)
    await input.fill(cadastro.valor)
    await page.locator('form button[type=submit]').click()
    await expect(page.getByRole('alert')).toContainText('Cadastro recusado')
    await expect(input).toHaveValue(cadastro.valor)
  })
}
