package com.ecothugom.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

interface MaterialRepository extends JpaRepository<Material, Integer> {
    boolean existsByCategoryIdAndNameIgnoreCaseAndGradeIgnoreCase(Integer categoryId,String name,String grade);
    boolean existsByCategoryIdAndNameIgnoreCaseAndGradeIgnoreCaseAndIdNot(Integer categoryId,String name,String grade,Integer id);
    @Query(value="""
        select m from Material m join fetch m.category c
        where (:categoryId is null or c.id=:categoryId) and (:accepted is null or m.accepted=:accepted)
        """,countQuery="""
        select count(m) from Material m join m.category c
        where (:categoryId is null or c.id=:categoryId) and (:accepted is null or m.accepted=:accepted)
        """)
    Page<Material> findForAdmin(@Param("categoryId") Integer categoryId,@Param("accepted") Boolean accepted,Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Material m where m.id=:id")
    Optional<Material> findForUpdate(@Param("id") int id);

    @Query("select m from Material m join fetch m.category c where m.id in :ids and m.accepted=true and c.active=true")
    List<Material> findAvailableByIds(@Param("ids") List<Integer> ids);

    @Query(value = """
        select m from Material m join fetch m.category c
        where m.accepted = true and c.active = true
          and (:categoryId is null or c.id = :categoryId)
          and (:materialId is null or m.id = :materialId)
        """, countQuery = """
        select count(m) from Material m join m.category c
        where m.accepted = true and c.active = true
          and (:categoryId is null or c.id = :categoryId)
          and (:materialId is null or m.id = :materialId)
        """)
    Page<Material> findAvailable(@Param("categoryId") Integer categoryId,
                                 @Param("materialId") Integer materialId, Pageable pageable);
}
