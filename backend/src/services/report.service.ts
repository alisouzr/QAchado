import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Status } from '@prisma/client';

// Resolução de caminhos no ecossistema ESM do Node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tipagem para os dados estruturados da vulnerabilidade injetados no gerador
interface ReportData {
  title: string;
  description: string;
  severity: string;
  recommendation: string;
  status: Status;
  cve: string | null;
  projectName: string;
}

/**
 * 1. Exportação Básica em formato Markdown
 */
export const generateMarkdownReport = (vulns: ReportData[]): string => {
  let md = `# Relatório Analítico de Vulnerabilidades\n`;
  md += `*Gerado automaticamente pelo sistema em: ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
  md += `---\n\n`;

  if (vulns.length === 0) {
    md += `Nenhum achado de segurança registrado para os filtros selecionados.\n`;
    return md;
  }

  vulns.forEach((vuln, index) => {
    md += `## ${index + 1}. [${vuln.severity}] ${vuln.title}\n`;
    md += `- **Projeto:** ${vuln.projectName}\n`;
    md += `- **Status Atual:** ${vuln.status}\n`;
    md += `- **Identificador (CVE):** ${vuln.cve || 'N/A'}\n\n`;
    md += `### Descrição Técnico-Operacional\n${vuln.description}\n\n`;
    md += `### Plano de Recomendação / Remediação\n${vuln.recommendation}\n\n`;
    md += `---\n\n`;
  });

  return md;
};

/**
 * 2. Compilação de Template .docx usando Docxtemplater
 */
export const generateDocxReport = (vulns: ReportData[]): Buffer => {
  // O template físico padrão deve ficar armazenado em: backend/src/templates/vuln_template.docx
  const templatePath = path.resolve(__dirname, '../templates/vuln_template.docx');

  if (!fs.existsSync(templatePath)) {
    throw new Error('Template básico de relatório .docx não encontrado no servidor.');
  }

  // Lê o arquivo binário do template Word
  const content = fs.readFileSync(templatePath, 'binary');
  
  // Instancia o PizZip para descompactar o .docx (que por baixo dos panos é um conjunto de XMLs)
  const zip = new PizZip(content);
  
  // Carrega o documento no motor do docxtemplater
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Mapeia e higieniza os dados do banco para casar com as chaves que o usuário colocou no Word
  // No seu arquivo Word, se você usar {#vulnerabilidades} ... {/vulnerabilidades} ele criará uma tabela/lista repetitiva
  const templatePayload = {
    data_geracao: new Date().toLocaleDateString('pt-BR'),
    total_achados: vulns.length,
    vulnerabilidades: vulns.map(v => ({
      titulo_vuln: v.title,
      projeto: v.projectName,
      severidade: v.severity,
      status: v.status,
      cve: v.cve || 'N/A',
      descricao: v.description,
      recomendacao: v.recommendation
    }))
  };

  // Injeta os dados nas tags do arquivo .docx
  doc.render(templatePayload);

  // Gera e compila o buffer final do Word modificado
  const outputBuffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return outputBuffer;
};