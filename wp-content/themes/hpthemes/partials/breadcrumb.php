<?php
global $post;

$array = [
    [
        'url'   => get_the_permalink(HP_PAGE_HOME),
        'title' => __('Trang chủ', 'monamedia')
    ],
];

if (wp_get_post_parent_id(get_the_ID())) {
    $parentId = wp_get_post_parent_id(get_the_ID());
    $array[] = [
        'url' => get_permalink($parentId),
        'title' => get_the_title($parentId),
    ];
}

if (is_home()) {

    $array[] = [
        'url' => '',
        'title' => get_the_title(HP_PAGE_BLOG),
    ];
} elseif (is_singular('post')) {

    global $post;
    $primary_taxonomy_term = get_primary_taxonomy_term($post->ID, 'category');
    if (!empty($primary_taxonomy_term)) {
        $root = [];
        $root[$primary_taxonomy_term['slug']] = $primary_taxonomy_term['id'];
        $root = get_path_taxonomy_term_root($primary_taxonomy_term['parent'], $root, 'category');
        if (!empty($root)) {
            foreach ($root as $slug => $term_id) {

                $array[] = [
                    'url' => get_term_link($term_id, 'category'),
                    'title' => get_term_by('id', $term_id, 'category')->name,
                ];
            }
        } else {
            $array[] = [
                'url' => $primary_taxonomy_term['url'],
                'title' => $primary_taxonomy_term['title'],
            ];
        }
    }

    $array[] = [
        'url' => '',
        'title' => get_the_title(),
    ];
} elseif (is_category() || is_tag()) {

    $array[] = [
        'url' => '',
        'title' => get_queried_object()->name,
    ];

} elseif (is_tax('category_review')) {

    $current = get_queried_object();
    $root = [];
    if ($current->parent != 0) {

        $root[$current->slug] = $current->term_id;
        $root = get_path_taxonomy_term_root($current->parent, $root, $current->taxonomy);
        if (!empty($root)) {
            foreach ($root as $slug => $term_id) {
                $array[] = [
                    'url' => get_term_link($term_id, $current->taxonomy),
                    'title' => get_term_by('id', $term_id, $current->taxonomy)->name,
                ];
            }
        }
    } else {

        $array[] = [
            'url' => '',
            'title' => $current->name,
        ];
    }
} elseif (is_search()) {

    $array[] = [
        'url' => '',
        'title' => __('Tìm kiếm: ', 'monamedia') . '"<span class="keyword">' . get_search_query('s') . '</span>"',
    ];
} else {

    $array[] = [
        'url' => '',
        'title' => get_the_title(),
    ];
}
?>
<div class="ss-pd-t">
    <nav class="breadcrumb border-b border-[#f3f3f3] py-[1.2rem]" aria-label="Breadcrumb">
        <div class="container">
            <div class="breadcrumb-inner overflow-hidden">
                <ol class="breadcrumb-list flex flex-wrap items-center list-none text-[1.3rem] leading-[1.4] max-[768px]:text-[1.2rem]"
                    itemscope
                    itemtype="https://schema.org/BreadcrumbList">
                    <?php
                    if (is_array($array)) {
                        foreach ($array as $pos => $item) {
                            $title = $item['title'];
                            $url   = $item['url'] ?? '';
                    ?>
                    <li class="breadcrumb-item flex items-center min-w-0"
                        itemprop="itemListElement"
                        itemscope
                        itemtype="https://schema.org/ListItem">
                        <a href="<?php echo esc_url( $url ?: 'javascript:;' ); ?>"
                           class="breadcrumb-link block whitespace-nowrap overflow-hidden text-ellipsis max-w-[24rem] text-[#888] transition-colors duration-200 max-[768px]:max-w-[16rem]"
                           itemprop="item">
                            <span itemprop="name"><?php echo $title; ?></span>
                        </a>
                        <meta itemprop="position" content="<?php echo esc_attr( $pos + 1 ); ?>">
                    </li>
                    <?php
                        }
                    }
                    ?>
                </ol>
            </div>
        </div>
    </nav>
</div>
