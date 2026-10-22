const express = require("express");
const service = require("../services/chamadoService");

const router = express.Router();

// Classes 22 (dado inválido) e 23 (restrição violada) do Postgres: o banco
// recusou algo que a validação do service deixou passar.
function ehErroDeDadoDoBanco(err) {
  return typeof err.code === "string" && /^2[23]/.test(err.code);
}

function asHandler(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      res.json(result);
    } catch (err) {
      if (err instanceof service.RegraDeNegocioError) {
        return res.status(err.statusCode).json({ erro: err.message });
      }
      if (ehErroDeDadoDoBanco(err)) {
        return res.status(422).json({ erro: "Dados inválidos." });
      }
      console.error(err);
      res.status(500).json({ erro: "Erro interno." });
    }
  };
}

// Setores
router.get("/setores", asHandler(() => service.listarSetores()));
router.post("/setores", asHandler((req) => service.criarSetor(req.body)));

// Equipamentos
router.get("/equipamentos", asHandler(() => service.listarEquipamentos()));
router.post("/equipamentos", asHandler((req) => service.criarEquipamento(req.body)));

// Técnicos
router.get("/tecnicos", asHandler(() => service.listarTecnicos()));

// Chamados
router.get("/chamados", asHandler((req) => service.listarChamados(req.query)));
router.post("/chamados", asHandler((req) => service.abrirChamado(req.body)));
router.patch(
  "/chamados/:id/atribuir",
  asHandler((req) =>
    service.atribuirChamado({ chamadoId: req.params.id, tecnicoId: req.body.tecnicoId })
  )
);
router.patch(
  "/chamados/:id/concluir",
  asHandler((req) => {
    const { laudo, causaRaiz, pecasTrocadas } = req.body || {};
    return service.concluirChamado({ chamadoId: req.params.id, laudo, causaRaiz, pecasTrocadas });
  })
);

module.exports = router;
