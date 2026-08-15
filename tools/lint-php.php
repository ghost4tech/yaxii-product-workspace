<?php
/**
 * Lint every maintained PHP file without shell-specific globbing.
 *
 * @package YaxiiProductWorkspace
 */

$ypw_root  = dirname( __DIR__ );
$ypw_paths = array( $ypw_root . '/yaxii-product-workspace.php', $ypw_root . '/src', $ypw_root . '/tests' );
$ypw_files = array();

foreach ( $ypw_paths as $ypw_path ) {
	if ( is_file( $ypw_path ) ) {
		$ypw_files[] = $ypw_path;
		continue;
	}

	$ypw_iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $ypw_path ) );
	foreach ( $ypw_iterator as $ypw_file ) {
		if ( $ypw_file->isFile() && 'php' === strtolower( $ypw_file->getExtension() ) ) {
			$ypw_files[] = $ypw_file->getPathname();
		}
	}
}

sort( $ypw_files );
foreach ( $ypw_files as $ypw_file ) {
	$ypw_output = array();
	$ypw_status = 0;
	exec( escapeshellarg( PHP_BINARY ) . ' -l ' . escapeshellarg( $ypw_file ), $ypw_output, $ypw_status );
	echo implode( PHP_EOL, $ypw_output ) . PHP_EOL;
	if ( 0 !== $ypw_status ) {
		exit( $ypw_status );
	}
}

echo sprintf( 'Linted %d maintained PHP files.', count( $ypw_files ) ) . PHP_EOL;
