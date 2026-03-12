<div class="newsdt-sc">
    <div class="igr">
        <a class="i-link" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(get_the_permalink()); ?>&t=<?php the_title(); ?>" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=400,width=500');
                return false;">
            <i class="fab fa-facebook"></i>
        </a>
        <a class="i-link" href="https://www.linkedin.com/cws/share?url=<?php echo urlencode(get_the_permalink()); ?>&title=<?php the_title(); ?>" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=400,width=500');
            return false;">
            <i class="fab fa-linkedin"></i>
        </a>
        <a class="i-link" href="http://www.twitter.com/share?url=<?php echo urlencode(get_the_permalink()); ?>" class="item twitter" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=400,width=500');
                return false;">
            <i class="fab fa-twitter"></i>
        </a>
    </div>
</div>