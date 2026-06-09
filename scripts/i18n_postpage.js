const fs = require('fs');
const file = 'c:/Users/pedro/Desktop/Dev/front-micelio/src/components/PostPage/index.js';
let c = fs.readFileSync(file, 'utf8');

function replace(from, to) {
  if (!c.includes(from)) {
    console.warn('NOT FOUND:', from.slice(0, 60));
    return;
  }
  c = c.replace(from, to);
}

// Add useTranslation import
replace(
  'import ShareButton from "../ShareButton";',
  'import ShareButton from "../ShareButton";\nimport { useTranslation } from "react-i18next";'
);

// Add t inside component
replace(
  'const fromPost = location.state?.fromPost ?? null;',
  'const { t } = useTranslation();\n\n  const fromPost = location.state?.fromPost ?? null;'
);

// imageUploadCommand
replace(
  '"aria-label": "Inserir imagem", title: "Inserir imagem"',
  '"aria-label": t("postPage.insertImage"), title: t("postPage.insertImage")'
);

// Errors
replace('alert("Erro ao enviar imagem.");', 'alert(t("postPage.imageError"));');
replace('alert("Erro ao enviar capa.");', 'alert(t("postPage.coverError"));');
replace('alert("Erro ao salvar o post.");', 'alert(t("postPage.savePostError"));');
replace('alert("Erro ao deletar o post.");', 'alert(t("postPage.deletePostError"));');

// delete confirm
replace(
  'if (!window.confirm(`Deletar "${post.title}"? Essa ação não pode ser desfeita.`)) return;',
  'if (!window.confirm(t("postPage.deleteConfirm", { title: post.title }))) return;'
);

// Loading state
replace(
  '<div style={{ color: "#aaa", padding: "40px" }}>Carregando...</div>',
  '<div style={{ color: "#aaa", padding: "40px" }}>{t("postPage.loading")}</div>'
);

// WikilinkSubjectsModal confirmLabel
replace('confirmLabel="Confirmar e salvar"', 'confirmLabel={t("postPage.confirmSave")}');

// Subject modal title
replace(
  '>Categorias do post</h3>',
  '>{t("postPage.postCategories")}</h3>'
);

// Subject modal new category placeholder (in postPage subject modal)
replace(
  'placeholder="Nova categoria..." style={{ flex: 1, background: "#1e1e1e"',
  'placeholder={t("postPage.newCategory")} style={{ flex: 1, background: "#1e1e1e"'
);

// Subject modal confirm button
replace(
  '              Confirmar\n            </button>',
  '              {t("common.confirm")}\n            </button>'
);

// + subject button
replace(
  '                  + subject\n                </button>',
  '                  {t("postPage.addSubject")}\n                </button>'
);

// Save/Cancel in edit mode
replace(
  '{isSaving ? "Salvando..." : "Salvar"}',
  '{isSaving ? t("postPage.saving") : t("common.save")}'
);
replace(
  '                  Cancelar\n                </button>',
  '                  {t("common.cancel")}\n                </button>'
);

// Cover upload labels
replace(
  '{uploadingCover ? "Enviando…" : "Alterar capa"}',
  '{uploadingCover ? t("userProfile.uploading") : t("postPage.changeCover")}'
);
replace(
  '{uploadingCover ? "Enviando…" : "+ Adicionar capa"}',
  '{uploadingCover ? t("userProfile.uploading") : t("postPage.addCover")}'
);
replace('title="Alterar capa"', 'title={t("postPage.changeCover")}');

// ref post button label
replace(
  '                      ref post\n                    </button>',
  '                      {t("postPage.refPost")}\n                    </button>'
);

// View timeline title
replace(
  'title="Ver pensamento sendo construído"',
  'title={t("postPage.viewTimeline")}'
);

// Author/Subject labels
replace(
  'Autor: <span style={{ color: "#aaa" }}>{post.author}</span>',
  '{t("postPage.author")} <span style={{ color: "#aaa" }}>{post.author}</span>'
);
replace('<span>Assunto:</span>', '<span>{t("postPage.subject")}</span>');

// Like button title
replace(
  'title={isLoggedIn ? (likedByMe ? "Descurtir" : "Curtir") : "Faça login para curtir"}',
  'title={isLoggedIn ? (likedByMe ? t("postPage.unlike") : t("postPage.like")) : t("postPage.loginToLike")}'
);

// Sidebar headings
replace('>Graph local\n              </h4>', '>{t("postPage.localGraph")}\n              </h4>');
replace('>Posts linkados</h4>', '>{t("postPage.linkedPosts")}</h4>');
replace('>Referenciado por</h4>', '>{t("postPage.referencedBy")}</h4>');
replace('>Timeline</h4>', '>{t("postPage.timeline")}</h4>');
replace('>← grafo</button>', '>{t("postPage.backToGraph")}</button>');

// Timeline speed buttons - replace Object.keys with entries approach
replace(
  'Object.keys(TL_SPEEDS).map((s) => (',
  'Object.entries({ Devagar: "postPage.slow", Normal: "postPage.normal", "Rápido": "postPage.fast" }).map(([s, tKey]) => ('
);
replace(
  '                        {s}\n                      </button>',
  '                        {t(tKey)}\n                      </button>'
);

fs.writeFileSync(file, c, 'utf8');
console.log('Done');
