<?php
require 'vendor/autoload.php';
require 'connection.php'; 

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

// Função para montar a query com base nos filtros
function montarQuery(array $post): string {
    $where = [];

    if (!empty($post['tipoChamado'])) {
        $where[] = "type = '" . addslashes($post['tipoChamado']) . "'";
    }

    if (!empty($post['status'])) {
        $where[] = "status = '" . addslashes($post['status']) . "'";
    }

    $filter = $post['filterDownload'] ?? 'all';
    $date = !empty($post['dateSearch']) ? new DateTime($post['dateSearch']) : new DateTime();

    if ($filter !== 'all') {
        if ($filter === 'day') {
            $inicio = $date->format('Y-m-d') . ' 00:00:00';
            $fim    = $date->format('Y-m-d') . ' 23:59:59';
        } elseif ($filter === 'week') {
            $diaSemana = (int)$date->format('N');
            $startObj = clone $date;
            $startObj->modify('-' . ($diaSemana - 1) . ' days')->setTime(0, 0, 0);
            $endObj = clone $startObj;
            $endObj->modify('+6 days')->setTime(23, 59, 59);

            $inicio = $startObj->format('Y-m-d H:i:s');
            $fim = $endObj->format('Y-m-d H:i:s');
        } elseif ($filter === 'month') {
            $inicio = $date->format('Y-m-01') . ' 00:00:00';
            $fim    = $date->format('Y-m-t') . ' 23:59:59';
        }

        $where[] = "time BETWEEN '$inicio' AND '$fim'";
    }

    $query = "SELECT * FROM calling";
    if (!empty($where)) {
        $query .= " WHERE " . implode(" AND ", $where);
    }

    return $query;
}

// Coleta os dados do POST
$post = [
    'tipoChamado' => $_POST['tipoChamado'] ?? null,
    'status' => $_POST['status'] ?? null,
    'filterDownload' => $_POST['filterDownload'] ?? 'all',
    'dateSearch' => $_POST['dateSearch'] ?? null,
];

// Monta e executa a query
$query = montarQuery($post);
$result = mysqli_query($conn, $query);
if (!$result) {
    die('Erro na consulta: ' . mysqli_error($conn));
}

// Cria a planilha
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

if (mysqli_num_rows($result) > 0) {
    // Cabeçalhos
    /* $campos = array_keys(mysqli_fetch_assoc($result));
    mysqli_data_seek($result, 0);

    foreach ($campos as $i => $campo) {
        $col = Coordinate::stringFromColumnIndex($i + 1);
        $sheet->setCellValue($col . '1', $campo);
    }
 */
    $cabecalhos = [
    'ID', 'Criação', 'Atualização', 'Encerrado',
    'Setor', 'Usuário', 'Tipo', 'Status',
    'Descrição', 'User_Key', 'Nota atribuída.'
    ];

    foreach ($cabecalhos as $i => $titulo) {
        $col = Coordinate::stringFromColumnIndex($i + 1);
        $sheet->setCellValue($col . '1', $titulo);
    }
    // Dados
    $linha = 2;
    while ($row = mysqli_fetch_assoc($result)) {
        foreach (array_values($row) as $col => $value) {
            $colLetra = Coordinate::stringFromColumnIndex($col + 1);
            $sheet->setCellValue($colLetra . $linha, $value);
        }
        $linha++;
    }
} else {
    $sheet->setCellValue('A1', 'Nenhum resultado encontrado.');
}

// Define nome do arquivo e envia pro navegador
$filename = 'chamados_' . date('Ymd_His') . '.xlsx';
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header("Content-Disposition: attachment; filename=\"$filename\"");
header('Cache-Control: max-age=0');
error_log($query);
$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;

