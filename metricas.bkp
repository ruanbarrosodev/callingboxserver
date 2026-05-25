<?php 
header('Content-Type: application/json');
require('connection.php');

$tipo = $_POST['filterTime'] ?? 'dia'; 
$dateControl = $_POST['dateControl'] ?? '';

if (empty($dateControl)) {
    // Sem dateControl: usa CURDATE()
    switch (strtolower($tipo)) {
        case 'semana':
            $where = "YEARWEEK(time, 1) = YEARWEEK(CURDATE(), 1)";
            break;
        case 'mes':
            $where = "YEAR(time) = YEAR(CURDATE()) AND MONTH(time) = MONTH(CURDATE())";
            break;
        default:
            $where = "DATE(time) = CURDATE()";
    }
} else {
    // Com dateControl: usa a data enviada
    $date = mysqli_real_escape_string($conn, $dateControl);

    switch (strtolower($tipo)) {
        case 'semana':
            $where = "YEARWEEK(time, 1) = YEARWEEK('$date', 1)";
            break;
        case 'mes':
            $where = "YEAR(time) = YEAR('$date') AND MONTH(time) = MONTH('$date')";
            break;
        default:
            $where = "DATE(time) = '$date'";
    }
}

$sql = "SELECT * FROM calling WHERE $where";
$result = mysqli_query($conn, $sql);
$countByDate = mysqli_num_rows($result);
$sqlTotal = "SELECT * FROM calling";
$resultTotal = mysqli_query($conn, $sqlTotal);
$countTotal = mysqli_num_rows($resultTotal);
$data = [];
$metrica = [];
while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

$sql1 = "SELECT 
            ROUND(AVG(TIMESTAMPDIFF(MINUTE, time, doneTime))) AS TMA_em_minutos
            FROM calling
            WHERE doneTime IS NOT NULL;
        ";
$result1 = mysqli_query($conn, $sql1);
if ($result1 && $row = mysqli_fetch_assoc($result1)) {
    $tmaMinutos = (int) $row['TMA_em_minutos'];

    if ($tmaMinutos >= 60) {
        $horas = floor($tmaMinutos / 60);
        $min = $tmaMinutos % 60;
        $metricaTMA = $horas . 'h';
        if ($min > 0) {
            $metricaTMA .= ' ' . $min . 'min';
        }
    } else {
        $metricaTMA = $tmaMinutos . 'min';
    }
}

$sql2 = "SELECT 
            ROUND(AVG(TIMESTAMPDIFF(MINUTE, time, updateTime))) AS TMR_em_minutos
            FROM calling
            WHERE updateTime IS NOT NULL
        ";
$result2 = mysqli_query($conn, $sql2);
if ($result2 && $row = mysqli_fetch_assoc($result2)) {
    $tmrMinutos = (int) $row['TMR_em_minutos'];

    if ($tmrMinutos >= 60) {
        $horas = floor($tmrMinutos / 60);
        $min = $tmrMinutos % 60;

        $metricaTMR = $horas . 'h';
        if ($min > 0) {
            $metricaTMR .= ' ' . $min . 'min';
        }
    } else {
        $metricaTMR = $tmrMinutos . 'min';
    }
}

$sqlNSU = "SELECT AVG(nota) AS media_nota FROM calling WHERE nota IS NOT NULL";
$resultNSU = mysqli_query($conn, $sqlNSU);

if ($resultNSU && $row = mysqli_fetch_assoc($resultNSU)) {
    $mediaNota = (float) $row['media_nota'];
    $maxNota = 5; // nota máxima
    $mediaNotaPercent = ($mediaNota / $maxNota) * 100;
    $metricaNSU = number_format($mediaNotaPercent, 2) . '%';
} else {
    $metricaNSU = '0%';
}


$sql5 = "SELECT count(*) as metrica5
FROM calling
WHERE doneTime IS NOT NULL
AND TIMESTAMPDIFF(DAY, time, doneTime) <= 2";
$result5 = mysqli_query($conn, $sql5);
if ($result5 && $row = mysqli_fetch_assoc($result5)) {
    $countMetrica5 = (int) $row['metrica5'];
    error_log( $countMetrica5);
    $metrica[5] = ($countTotal > 0) ? round(($countMetrica5 / $countTotal) * 100, 2) . '%' : '0%';
}

$sql6 = "SELECT COUNT(*) AS metrica6
         FROM calling
         WHERE doneTime IS NULL
           AND time < NOW() - INTERVAL 2 DAY";
$result6 = mysqli_query($conn, $sql6);
if ($result6 && $row = mysqli_fetch_assoc($result6)) {
    $metrica[6] = (int) $row['metrica6'];
}

$response = array(
    'query' => $sql,
    'countByDate' => $countByDate,
    'metrica1' => $metricaTMA,
    'metrica2' => $metricaTMR,
    'metrica3' => $metricaNSU,
    'metrica5' => $metrica[5],
    'metrica6' => $metrica[6]
);

echo json_encode($response);