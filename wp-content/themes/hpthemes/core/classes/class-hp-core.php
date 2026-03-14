<?php
class Hp_Core extends Setup_Theme
{

    public function load_core()
    {
        parent::__construct();
        $this->include_files();
    }

    public function include_files()
    {
        $regsiter_load_files = [
            'app/api' => [
                'method'   => '',
                'autoload' => array(
                    'functions.php',
                ),
            ],
            'core' => [
                'method'   => '',
                'autoload' => [
                    'walker-menu.php',
                    'regsiter-post-type.php',
                    'customizer.php',
                    'hooks.php',
                    'functions.php',
                    'acf.php',
                ],
            ],
        ];

        if (is_array($regsiter_load_files)) {
            foreach ($regsiter_load_files as $path => $file) {
                $filePath = $path;
                // auto load file
                $autoladFiles = $file['autoload'];
                if (! empty($autoladFiles)) {
                    foreach ($autoladFiles as $loadFile) {
                        $file_path = get_template_directory() . '/' . $filePath . '/' . $loadFile;
                        if (file_exists($file_path)) {
                            require_once($file_path);
                        }
                    }
                }
            }
        }
    }
}
